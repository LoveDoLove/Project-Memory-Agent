# Pester tests for install.ps1 (no network; Invoke-WebRequest mocked)
# Compatible with Pester 3.4.0 (WindowsPowerShell default). Run:
#   Invoke-Pester ./install.tests.ps1
# If you upgrade to Pester 5, change "Should Be/Exist/Not Exist" accordingly
# (Pester 5 uses Should -Be / Should -Exist / Should -Not -Exist).

Describe 'install.ps1' {

    BeforeAll {
        $script:origProfile = $env:USERPROFILE
        try { . $PSScriptRoot\install.ps1 } catch { }
    }

    AfterAll {
        $env:USERPROFILE = $script:origProfile
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
            $skillFile = Join-Path $d.FullName 'SKILL.md'
            if (Test-Path $skillFile) {
                $nameLine = Get-Content $skillFile | Where-Object { $_ -match '^name:' } | Select-Object -First 1
                if ($nameLine) {
                    $nm = ($nameLine -split ':', 2)[1].Trim()
                    $script:SkillNames += $nm
                }
            }
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
}
