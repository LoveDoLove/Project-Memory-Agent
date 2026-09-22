param(
    [string]$Target = '',
    [switch]$Force,
    [switch]$Verify,
    [string]$Branch = 'main',
    [string]$DshProfile = '',
    [switch]$Interactive
)

$Repo = 'LoveDoLove/Project-Memory-Agent'
$Base = "https://raw.githubusercontent.com/$Repo/$Branch"
$Skills = @('knowledge-classification','knowledge-compounding','knowledge-discovery','memory-architecture','memory-edit','memory-verification','obsolete-knowledge','repository-audit')
$AgentMd = 'agents/project-memory.md'
$AgentToml = 'agents/project-memory.toml'
$PluginName = '@lovedolove/dsh-project-memory'
$AgentCordisYml = 'agent.cordis.yml'
$PresetYml = 'preset.yml'

function Print-Banner {
    Write-Host ""
    Write-Host "  ____            _           _     __  __                                " -ForegroundColor Cyan
    Write-Host " |  _ \ _ __ ___ (_) ___  ___| |_  |  \/  | ___ _ __ ___   ___  _ __ _   _ " -ForegroundColor Cyan
    Write-Host " | |_) | '__/ _ \| |/ _ \/ __| __| | |\/| |/ _ \ '_ \` _ \ / _ \| '__| | | |" -ForegroundColor Cyan
    Write-Host " |  __/| | | (_) | |  __/ (__| |_  | |  | |  __/ | | | | | (_) | |  | |_| |" -ForegroundColor Cyan
    Write-Host " |_|   |_|  \___// |\___|\___|\__| |_|  |_|\___|_| |_| |_|\___/|_|   \__, |" -ForegroundColor Cyan
    Write-Host "               |__/                                                  |___/ " -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Engineering Memory Agent (EMA) Installer — DeepSeek Harness Ready" -ForegroundColor White
    Write-Host ""
}

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
        try {
            New-Item -ItemType Directory -Force -Path (Split-Path $d) | Out-Null
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

function Install-EmaCmd {
    $binDir = Join-Path $env:USERPROFILE '.local\bin'
    New-Item -ItemType Directory -Force -Path $binDir | Out-Null
    $cmdPath = Join-Path $binDir 'ema.cmd'

    $cmdContent = @"
@echo off
if exist "%CD%\bin\ema-cli.mjs" (
  node "%CD%\bin\ema-cli.mjs" %*
  exit /b %ERRORLEVEL%
)
if exist "%CD%\dsh-plugin\bin\ema-cli.mjs" (
  node "%CD%\dsh-plugin\bin\ema-cli.mjs" %*
  exit /b %ERRORLEVEL%
)
if exist "%USERPROFILE%\.dsh\profiles\web\node_modules\@lovedolove\dsh-project-memory\bin\ema-cli.mjs" (
  node "%USERPROFILE%\.dsh\profiles\web\node_modules\@lovedolove\dsh-project-memory\bin\ema-cli.mjs" %*
  exit /b %ERRORLEVEL%
)
npx -y @lovedolove/dsh-project-memory ema %*
"@

    Set-Content -Path $cmdPath -Value $cmdContent -Encoding ASCII
    Write-Host "  ✓ EMA CLI installed: $cmdPath" -ForegroundColor Cyan

    # Ensure in User PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$binDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$binDir;$userPath", "User")
        $env:Path = "$binDir;$env:Path"
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
    Print-Banner
    $script:Installed = @()
    $script:Failures = @()

    # 1. Install CLI
    Install-EmaCmd

    $targets = @()
    if (-not $Target) {
        if ($Interactive) {
            Write-Host "Select target:"
            Write-Host "  1 OpenCode  2 Codex  3 Claude  4 DSH  5 Global  6 All  Q Quit"
            try { $choice = Read-Host "Choice" } catch { $choice = '4' }
            if ($choice -eq 'Q' -or $choice -eq 'q') { return }
            if ($choice -eq '1') { $targets = @('opencode') }
            elseif ($choice -eq '2') { $targets = @('codex') }
            elseif ($choice -eq '3') { $targets = @('claude') }
            elseif ($choice -eq '4') { $targets = @('dsh') }
            elseif ($choice -eq '5') { $targets = @('global') }
            else { $targets = @('all') }
        } else {
            # Default to DSH + All tools for seamless one-line curl/irm install
            $targets = @('all')
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
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.agents\agents\project-memory.md"
            }
            'dsh' {
                $profileName = Get-DshProfileName -ExplicitName $DshProfile
                $presetDir = Join-Path (Join-Path (Join-Path $env:USERPROFILE '.dsh') '.agent-presets') 'project-memory'
                New-Item -ItemType Directory -Force -Path $presetDir | Out-Null
                Write-Host "  DSH profile: $profileName"
                Write-Host ""
                foreach ($f in @($AgentCordisYml, $PresetYml)) {
                    $u = "$Base/$f"
                    $d = Join-Path $presetDir $f
                    if ($Verify) {
                        Write-Host "  would install: $d"
                        $script:Installed += $d
                        continue
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
                    $dshCmd = Get-Command 'dsh' -ErrorAction SilentlyContinue
                    if ($dshCmd) {
                        try {
                            if ($dshCmd.CommandType -eq 'ExternalScript') {
                                & $dshCmd.Source plugin --profile $profileName add $PluginName
                            } else {
                                $proc = Start-Process -FilePath "dsh" -ArgumentList "plugin --profile $profileName add $PluginName" -NoNewWindow -Wait -PassThru -ErrorAction Stop
                                if ($proc.ExitCode -eq 0) {
                                    Write-Host "  plugin installed: $PluginName on profile '$profileName'"
                                } else {
                                    Write-Warning "  plugin install failed (exit code $($proc.ExitCode))"
                                }
                            }
                        } catch {
                            Write-Warning "  dsh plugin command failed: $_"
                        }
                    } else {
                        Write-Host "  Run plugin command:"
                        Write-Host "    dsh plugin --profile $profileName add $PluginName"
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
                foreach ($f in @($AgentCordisYml, $PresetYml)) {
                    $u = "$Base/$f"
                    $d = Join-Path $presetDir $f
                    if ($Verify) {
                        Write-Host "  would install: $d"
                        $script:Installed += $d
                        continue
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
                    $dshCmd = Get-Command 'dsh' -ErrorAction SilentlyContinue
                    if ($dshCmd) {
                        try {
                            if ($dshCmd.CommandType -eq 'ExternalScript') {
                                & $dshCmd.Source plugin --profile $profileName add $PluginName
                            } else {
                                $proc = Start-Process -FilePath "dsh" -ArgumentList "plugin --profile $profileName add $PluginName" -NoNewWindow -Wait -PassThru -ErrorAction Stop
                                if ($proc.ExitCode -eq 0) {
                                    Write-Host "  plugin installed: $PluginName on profile '$profileName'"
                                } else {
                                    Write-Warning "  plugin install failed (exit code $($proc.ExitCode))"
                                }
                            }
                        } catch {
                            Write-Warning "  dsh plugin command failed: $_"
                        }
                    } else {
                        Write-Host "  Run plugin command:"
                        Write-Host "    dsh plugin --profile $profileName add $PluginName"
                    }
                } else {
                    Write-Host "  would install plugin: dsh plugin --profile $profileName add $PluginName"
                }
            }
            default { Write-Warning "Unknown target: $t"; $script:Failures += "target:$t" }
        }
    }

    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "  ✨ Project Memory Agent (EMA) Installed Successfully!" -ForegroundColor Green
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🤖 Inside DeepSeek Harness:" -ForegroundColor Cyan
    Write-Host "   Type '/ema' or '/project-memory' in any session chat."
    Write-Host ""
    Write-Host "🌐 Interactive Visual Memory Graph:" -ForegroundColor Cyan
    Write-Host "   Run 'ema ui' in your project directory (http://127.0.0.1:3888)"
    Write-Host ""
    Write-Host "⚡ Auto-Distillation & Ingestion:" -ForegroundColor Cyan
    Write-Host "   Run 'ema ingest --git' to capture changes into candidate queue."
    Write-Host ""
}

if ($MyInvocation.InvocationName -ne '.') { Main }
