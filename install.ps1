param(
    [string]$Target = '',
    [switch]$Force,
    [switch]$Verify,
    [string]$Branch = 'main',
    [string]$DshProfile = ''
)

$Repo = 'LoveDoLove/Project-Memory-Agent'
$Base = "https://raw.githubusercontent.com/$Repo/$Branch"
$Skills = @('knowledge-classification','knowledge-compounding','knowledge-discovery','memory-architecture','memory-edit','memory-verification','obsolete-knowledge','repository-audit')
$AgentMd = 'agents/project-memory.md'
$AgentToml = 'agents/project-memory.toml'
$PluginName = '@lovedolove/dsh-project-memory'
$AgentCordisYml = 'agent.cordis.yml'
$PresetYml = 'preset.yml'

function Install-Skills($skillsDir) {
    New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null
    foreach ($s in $Skills) {
        $u = "$Base/skills/$s/SKILL.md"
        $d = Join-Path (Join-Path $skillsDir $s) 'SKILL.md'
        if ($Verify) {
            Write-Host "  would install: $d"
            $script:Installed += $d
            continue
        }
        if ((Test-Path $d) -and -not $Force) {
            $ans = Read-Host "Overwrite $d ? [Y/N]"
            if ($ans -notmatch '^[Yy]') { Write-Host "  skipped: $d"; continue }
        }
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $u -OutFile $d
            Write-Host "  installed: $d"
            $script:Installed += $d
        } catch {
            Write-Warning "  failed: $u ($_)"
            $script:Failures += $u
        }
    }
}

function Install-Agent($srcRel, $agentDest) {
    $u = "$Base/$srcRel"
    if ($Verify) {
        Write-Host "  would install agent: $agentDest"
        $script:Installed += $agentDest
        return
    }
    if ((Test-Path $agentDest) -and -not $Force) {
        $ans = Read-Host "Overwrite $agentDest ? [Y/N]"
        if ($ans -notmatch '^[Yy]') { Write-Host "  skipped: $agentDest"; return }
    }
    try {
        New-Item -ItemType Directory -Force -Path (Split-Path $agentDest) | Out-Null
        Invoke-WebRequest -UseBasicParsing -Uri $u -OutFile $agentDest
        Write-Host "  installed agent: $agentDest"
        $script:Installed += $agentDest
    } catch {
        Write-Warning "  failed: $u ($_)"
        $script:Failures += $u
    }
}

function Get-DshProfileName {
    param([string]$ExplicitName)
    if ($ExplicitName) { return $ExplicitName }
    $profileDir = Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles'
    $candidates = @('web') + @(Get-ChildItem $profileDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'node_modules' } | Select-Object -ExpandProperty Name)
    foreach ($c in ($candidates | Select-Object -Unique)) {
        if (Test-Path (Join-Path $profileDir $c)) { return $c }
    }
    return 'project-memory'
}

function Main {
    $script:Installed = @()
    $script:Failures = @()

    $targets = @()
    if (-not $Target) {
        if ([Console]::IsInputRedirected) {
            $targets = @('all')
        } else {
            Write-Host "Select target:"
            Write-Host "  1 OpenCode  2 Codex  3 Claude  4 DSH  5 Global  6 All  Q Quit"
            try { $choice = Read-Host "Choice" } catch { $choice = '6' }
            if ($choice -eq 'Q' -or $choice -eq 'q') { return }
            if ($choice -eq '1') { $targets = @('opencode') }
            elseif ($choice -eq '2') { $targets = @('codex') }
            elseif ($choice -eq '3') { $targets = @('claude') }
            elseif ($choice -eq '4') { $targets = @('dsh') }
            elseif ($choice -eq '5') { $targets = @('global') }
            else { $targets = @('all') }
        }
    } else {
        $targets = @($Target)
    }

    foreach ($t in $targets) {
        switch ($t) {
            'opencode' {
                Install-Skills "$env:USERPROFILE\.config\opencode\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.config\opencode\agents\project-memory.md"
            }
            'claude' {
                Install-Skills "$env:USERPROFILE\.claude\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.claude\agents\project-memory.md"
            }
            'codex' {
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentToml "$env:USERPROFILE\.codex\agents\project-memory.toml"
            }
            'global' {
                # Cross-tool: skills to ~/.agents/skills/, agent to ~/.agents/agents/
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.agents\agents\project-memory.md"
            }
            'dsh' {
                $profileName = Get-DshProfileName -ExplicitName $DshProfile
                $presetDir = Join-Path (Join-Path (Join-Path $env:USERPROFILE '.dsh') '.agent-presets') 'project-memory'
                New-Item -ItemType Directory -Force -Path $presetDir | Out-Null
                Write-Host "  DSH profile: $profileName"
                Write-Host ""
                # Download cordis preset files from GitHub
                foreach ($f in @($AgentCordisYml, $PresetYml)) {
                    $u = "$Base/$f"
                    $d = Join-Path $presetDir $f
                    if ($Verify) {
                        Write-Host "  would install: $d"
                        $script:Installed += $d
                        continue
                    }
                    if ((Test-Path $d) -and -not $Force) {
                        $ans = Read-Host "Overwrite $d ? [Y/N]"
                        if ($ans -notmatch '^[Yy]') { Write-Host "  skipped: $d"; continue }
                    }
                    try {
                        Invoke-WebRequest -UseBasicParsing -Uri $u -OutFile $d
                        Write-Host "  installed preset: $d"
                        $script:Installed += $d
                    } catch {
                        Write-Warning "  failed: $u ($_)"
                        $script:Failures += $u
                    }
                }
                Write-Host ""
                # Install plugin and start orchestrator hint for DSH
                if (-not $Verify) {
                    try {
                        $proc = Start-Process -FilePath "dsh" -ArgumentList "plugin --profile $profileName add $PluginName" -NoNewWindow -Wait -PassThru -ErrorAction Stop
                        if ($proc.ExitCode -eq 0) {
                            Write-Host "  plugin installed: $PluginName on profile '$profileName'"
                        } else {
                            Write-Warning "  plugin install failed (exit $($_.ExitCode))"
                        }
                    } catch {
                        Write-Warning "  dsh plugin command not available: $_"
                    }
                } else {
                    Write-Host "  would install plugin: dsh plugin --profile $profileName add $PluginName"
                }
            }
            'all' {
                Install-Skills "$env:USERPROFILE\.claude\skills"
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.claude\agents\project-memory.md"
                Install-Agent $AgentMd "$env:USERPROFILE\.config\opencode\agents\project-memory.md"
                Install-Agent $AgentToml "$env:USERPROFILE\.codex\agents\project-memory.toml"
                $profileName = Get-DshProfileName -ExplicitName $DshProfile
                $presetDir = Join-Path (Join-Path (Join-Path $env:USERPROFILE '.dsh') '.agent-presets') 'project-memory'
                New-Item -ItemType Directory -Force -Path $presetDir | Out-Null
                Write-Host ""
                # Download cordis preset files from GitHub
                foreach ($f in @($AgentCordisYml, $PresetYml)) {
                    $u = "$Base/$f"
                    $d = Join-Path $presetDir $f
                    if ($Verify) {
                        Write-Host "  would install: $d"
                        $script:Installed += $d
                        continue
                    }
                    if ((Test-Path $d) -and -not $Force) {
                        $ans = Read-Host "Overwrite $d ? [Y/N]"
                        if ($ans -notmatch '^[Yy]') { Write-Host "  skipped: $d"; continue }
                    }
                    try {
                        Invoke-WebRequest -UseBasicParsing -Uri $u -OutFile $d
                        Write-Host "  installed preset: $d"
                        $script:Installed += $d
                    } catch {
                        Write-Warning "  failed: $u ($_)"
                        $script:Failures += $u
                    }
                }
                Write-Host ""
                if (-not $Verify) {
                    try {
                        $proc = Start-Process -FilePath "dsh" -ArgumentList "plugin --profile $profileName add $PluginName" -NoNewWindow -Wait -PassThru -ErrorAction Stop
                        if ($proc.ExitCode -eq 0) {
                            Write-Host "  plugin installed: $PluginName on profile '$profileName'"
                        } else {
                            Write-Warning "  plugin install failed (exit $($_.ExitCode))"
                        }
                    } catch {
                        Write-Warning "  dsh plugin command not available: $_"
                    }
                } else {
                    Write-Host "  would install plugin: dsh plugin --profile $profileName add $PluginName"
                }
            }
            default { Write-Warning "Unknown target: $t"; $script:Failures += "target:$t" }
        }
    }

    Write-Host ""
    Write-Host "Installed $($script:Installed.Count) item(s):"
    $script:Installed | ForEach-Object { Write-Host "  $_" }
    if ($script:Failures.Count -gt 0) {
        Write-Host "Failed $($script:Failures.Count):"
        $script:Failures | ForEach-Object { Write-Host "  $_" }
    }
    Write-Host ""
    if ($script:Failures.Count -gt 0) { exit 1 }
}

if ($MyInvocation.InvocationName -ne '.') { Main }
