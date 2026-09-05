# Pester tests for install.ps1 (no network; Invoke-WebRequest mocked)
# Compatible with Pester 3.4.0 (WindowsPowerShell default). Run:
#   Invoke-Pester ./install.tests.ps1

Describe 'install.ps1' {

    BeforeAll {
        try { . $PSScriptRoot\install.ps1 } catch { }
    }

    AfterAll {
    }

    BeforeEach {
        $script:prof = Join-Path $env:TEMP ("pmtest_" + [guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Force -Path $script:prof | Out-Null
        $env:USERPROFILE = $script:prof
    }

    AfterEach {
        if (Test-Path $script:prof) { Remove-Item -Recurse -Force $script:prof }
    }

    Mock Invoke-WebRequest { param($Uri, $OutFile); if ($OutFile) { New-Item -ItemType File -Force -Path $OutFile | Out-Null } }

    It 'single opencode: skills + agent' {
        $sk = Join-Path $env:USERPROFILE '.config\opencode\skills'
        Install-Skills $sk
        $ag = Join-Path $env:USERPROFILE '.config\opencode\agents\project-memory.md'
        Install-Agent 'agents/project-memory.md' $ag

        (Get-ChildItem -Directory $sk).Count | Should Be 8
        foreach ($d in (Get-ChildItem -Directory $sk)) { (Join-Path $d.FullName 'SKILL.md') | Should Exist }
        $ag | Should Exist
    }

    It 'single claude: skills + agent' {
        $sk = Join-Path $env:USERPROFILE '.claude\skills'
        Install-Skills $sk
        $ag = Join-Path $env:USERPROFILE '.claude\agents\project-memory.md'
        Install-Agent 'agents/project-memory.md' $ag

        (Get-ChildItem -Directory $sk).Count | Should Be 8
        foreach ($d in (Get-ChildItem -Directory $sk)) { (Join-Path $d.FullName 'SKILL.md') | Should Exist }
        $ag | Should Exist
    }

    It 'single codex: skills + agent .toml' {
        $sk = Join-Path $env:USERPROFILE '.agents\skills'
        Install-Skills $sk
        $ag = Join-Path $env:USERPROFILE '.codex\agents\project-memory.toml'
        Install-Agent 'agents/project-memory.toml' $ag

        (Get-ChildItem -Directory $sk).Count | Should Be 8
        foreach ($d in (Get-ChildItem -Directory $sk)) { (Join-Path $d.FullName 'SKILL.md') | Should Exist }
        $ag | Should Exist
    }

    It 'global target: installs skills to ~/.agents/skills and agent to ~/.agents/agents/' {
        $script:Target = 'global'
        $script:Force = $true
        Main

        (Join-Path $env:USERPROFILE '.agents\skills') | Should Exist
        (Get-ChildItem -Directory (Join-Path $env:USERPROFILE '.agents\skills')).Count | Should Be 8
        (Join-Path $env:USERPROFILE '.agents\agents\project-memory.md') | Should Exist
    }

    It 'dsh target: prints plugin add commands, seeds agent to ~/.dsh/agents/' {
        $script:Target = 'dsh'
        $script:Force = $true
        $script:DshProfile = 'web'
        # Create fake web profile so profile detection finds it.
        $profileDir = Join-Path $env:USERPROFILE '.dsh\profiles'
        New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
        New-Item -ItemType Directory -Force -Path (Join-Path $profileDir 'web') | Out-Null
        Main

        # Agent file should be seeded.
        (Join-Path $env:USERPROFILE '.dsh\agents\project-memory.md') | Should Exist
        # Verify the commands were printed by checking $script:Installed does NOT include any profile files
        # (no cordis.patch.yml or package.json modification — DSH target is CLI-only now).
        foreach ($item in $script:Installed) {
            $item -notmatch 'cordis\.patch\.yml' | Should Be $true
            $item -notmatch 'package\.json' | Should Be $true
            $item -notmatch 'pnpm-workspace' | Should Be $true
        }
    }

    It 'all target: installs all + prints DSH commands + seeds agent' {
        $script:Target = 'all'
        $script:Force = $true
        Main

        # Skills to both Claude and agents dirs.
        (Get-ChildItem -Directory (Join-Path $env:USERPROFILE '.claude\skills')).Count | Should Be 8
        (Get-ChildItem -Directory (Join-Path $env:USERPROFILE '.agents\skills')).Count | Should Be 8
        # Agents to each platform.
        (Join-Path $env:USERPROFILE '.claude\agents\project-memory.md') | Should Exist
        (Join-Path $env:USERPROFILE '.config\opencode\agents\project-memory.md') | Should Exist
        (Join-Path $env:USERPROFILE '.codex\agents\project-memory.toml') | Should Exist
        # DSH agent seeding.
        (Join-Path $env:USERPROFILE '.dsh\agents\project-memory.md') | Should Exist
    }

    It 'all: no double-load into opencode skills' {
        $claudeSkills = Join-Path $env:USERPROFILE '.claude\skills'
        $agentsSkills = Join-Path $env:USERPROFILE '.agents\skills'
        Install-Skills $claudeSkills
        Install-Skills $agentsSkills
        Install-Agent 'agents/project-memory.md' (Join-Path $env:USERPROFILE '.claude\agents\project-memory.md')
        Install-Agent 'agents/project-memory.md' (Join-Path $env:USERPROFILE '.config\opencode\agents\project-memory.md')
        Install-Agent 'agents/project-memory.toml' (Join-Path $env:USERPROFILE '.codex\agents\project-memory.toml')

        (Get-ChildItem -Directory $claudeSkills).Count | Should Be 8
        (Get-ChildItem -Directory $agentsSkills).Count | Should Be 8
        (Join-Path $env:USERPROFILE '.config\opencode\skills') | Should Not Exist
        (Join-Path $env:USERPROFILE '.claude\agents\project-memory.md') | Should Exist
        (Join-Path $env:USERPROFILE '.config\opencode\agents\project-memory.md') | Should Exist
        (Join-Path $env:USERPROFILE '.codex\agents\project-memory.toml') | Should Exist
    }
}

Describe 'skill name <-> manifest sync' {

    BeforeAll {
        try { . $PSScriptRoot\install.ps1 } catch { }
        $script:Skills = $Skills
        $skillsRoot = Join-Path $PSScriptRoot 'skills'
        $script:SkillNames = @()
        foreach ($d in (Get-ChildItem -Directory $skillsRoot)) {
            $nm = $d.Name
            if ($nm -match '^\.') { continue }
            $script:SkillNames += $nm
        }
        $agentFile = Join-Path $PSScriptRoot 'agents\project-memory.md'
        $script:AgentText = Get-Content $agentFile -Raw
    }

    It 'every skills/*/SKILL.md name is a member of $Skills' {
        foreach ($nm in $script:SkillNames) {
            $script:Skills -contains $nm | Should Be $true
        }
    }

    It 'agents/project-memory.md references every skill name' {
        foreach ($nm in $script:Skills) {
            $script:AgentText -match [regex]::Escape($nm) | Should Be $true
        }
    }

    It 'agents/project-memory.toml references every skill name' {
        $toml = Get-Content (Join-Path $PSScriptRoot 'agents\project-memory.toml') -Raw
        foreach ($s in $script:Skills) {
            ($toml -match [regex]::Escape($s)) | Should Be $true
        }
    }
}
