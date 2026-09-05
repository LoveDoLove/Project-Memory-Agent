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

    It 'dsh target: integrates into existing profile (web) when found, writes cordis patch' {
        # Create a fake 'web' profile with an existing package.json and empty cordis patch.
        $webProfile = Join-Path $env:USERPROFILE '.dsh\profiles\web'
        New-Item -ItemType Directory -Force -Path $webProfile | Out-Null
        @{ name = 'dsh-profile-web'; private = $true } | ConvertTo-Json | Out-File (Join-Path $webProfile 'package.json') -Encoding utf8
        @'
[]
'@ | Out-File (Join-Path $webProfile 'cordis.patch.yml') -Encoding utf8

        # Also create the dsh-plugin source so offline copy works.
        $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
        $pluginSrc = Join-Path $scriptDir 'dsh-plugin'
        if (-not (Test-Path $pluginSrc)) {
            $pluginSrc = Join-Path (Split-Path $scriptDir) 'Project-Memory-Agent\dsh-plugin'
        }
        if (Test-Path $pluginSrc) {
            $destDir = Join-Path $webProfile 'node_modules'
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
            # Create a fake plugin structure.
            $libDir = Join-Path $destDir '@lovedolove'
            New-Item -ItemType Directory -Force -Path $libDir | Out-Null
            $pluginDest = Join-Path $libDir 'dsh-project-memory'
            New-Item -ItemType Directory -Force -Path $pluginDest | Out-Null
            'package' | Out-File (Join-Path $pluginDest 'package.json') -Encoding utf8
            'lib' | Out-File (Join-Path $pluginDest 'lib.js') -Encoding utf8
        }

        $script:Target = 'dsh'
        $script:Force = $true
        Main

        $webProfile | Should Exist
        # Cordis patch must contain skill-filesystem.
        $patch = Get-Content (Join-Path $webProfile 'cordis.patch.yml') -Raw
        $patch -match 'skill-filesystem' | Should Be $true
        $patch -match 'customSkillDirs' | Should Be $true
        # package.json must list the plugin in bundles and dependencies.
        $pkg = Get-Content (Join-Path $webProfile 'package.json') -Raw | ConvertFrom-Json
        $pkg.dsh.profile.bundles -contains $PluginName | Should Be $true
        $depsKeys = $pkg.dependencies.PSObject.Properties.Name
        ($depsKeys -contains $PluginName) | Should Be $true
    }

    It 'dsh target: falls back to creating project-memory when no profile exists' {
        $script:Target = 'dsh'
        $script:Force = $true
        Main
        $fallbackProfile = Join-Path $env:USERPROFILE '.dsh\profiles\project-memory'
        $fallbackProfile | Should Exist
        $pkg = Get-Content (Join-Path $fallbackProfile 'package.json') -Raw | ConvertFrom-Json
        $pkg.dsh.profile.bundles -contains $PluginName | Should Be $true
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

    It 'agents/project-memory.toml references every skill name' {
        $toml = Get-Content (Join-Path $PSScriptRoot 'agents\project-memory.toml') -Raw
        foreach ($s in $script:Skills) {
            ($toml -match [regex]::Escape($s)) | Should Be $true
        }
    }
}
