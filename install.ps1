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
$RegistryPlugin = '@aiwayds/dsh-subagent-registry'

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

function Write-DshCommands {
    param([string]$ProfileName)
    Write-Host ""
    Write-Host "  Run these commands to finish DSH setup:"
    Write-Host "    dsh plugin --profile $ProfileName add $RegistryPlugin"
    Write-Host "    dsh plugin --profile $ProfileName add $PluginName"
    Write-Host ""
    Write-Host "  Then dispatch the orchestrator as a subagent:"
    Write-Host "    use_agent(agent: ""project-memory"", prompt: ""compound my last task"")"
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
                # Install skills to ~/.agents/skills (shared by Codex + other tools)
                # and agents to ~/.agents/agents (Claude Code compatible).
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.agents\agents\project-memory.md"
            }
            'dsh' {
                # Resolve profile name for command output.
                $profileDir = Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles'
                $profileName = if ($DshProfile) {
                    $DshProfile
                } else {
                    # Auto-detect: prefer 'web', else any existing profile, else 'project-memory'.
                    $candidates = @('web') + @(Get-ChildItem $profileDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'node_modules' } | Select-Object -ExpandProperty Name)
                    $found = $null
                    foreach ($c in ($candidates | Select-Object -Unique)) {
                        if (Test-Path (Join-Path $profileDir $c)) { $found = $c; break }
                    }
                    if (-not $found) { $found = 'project-memory' }
                    $found
                }

                Write-Host "  DSH profile: $profileName"
                Write-DshCommands $profileName

                # Seed agent file into ~/.dsh/agents/ so subagent-registry can find it.
                Install-Agent $AgentMd (Join-Path $env:USERPROFILE '.dsh\agents\project-memory.md')
            }
            'all' {
                Install-Skills "$env:USERPROFILE\.claude\skills"
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.claude\agents\project-memory.md"
                Install-Agent $AgentMd "$env:USERPROFILE\.config\opencode\agents\project-memory.md"
                Install-Agent $AgentToml "$env:USERPROFILE\.codex\agents\project-memory.toml"
                # DSH: resolve profile name and print commands.
                $profileDir = Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles'
                $profileName = if ($DshProfile) {
                    $DshProfile
                } else {
                    $candidates = @('web') + @(Get-ChildItem $profileDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'node_modules' } | Select-Object -ExpandProperty Name)
                    $found = $null
                    foreach ($c in ($candidates | Select-Object -Unique)) {
                        if (Test-Path (Join-Path $profileDir $c)) { $found = $c; break }
                    }
                    if (-not $found) { $found = 'project-memory' }
                    $found
                }
                Write-Host "  DSH profile: $profileName"
                Write-DshCommands $profileName
                # Seed agent file into ~/.dsh/agents/.
                Install-Agent $AgentMd (Join-Path $env:USERPROFILE '.dsh\agents\project-memory.md')
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
    Write-Host 'Codex users: to spawn this agent you may need `[features] multi_agent = true` in `~/.codex/config.toml` (not auto-applied).'
    Write-Host ''
    if ($DshProfile) {
        Write-Host "DSH plugin commands printed for profile '$DshProfile'."
    } else {
        Write-Host 'Run ``dsh plugin --profile <name> add @lovedolove/dsh-project-memory`` and ``dsh plugin --profile <name> add @aiwayds/dsh-subagent-registry`` manually, then use use_agent(agent: "project-memory", ...) to dispatch.'
    }
    if ($script:Failures.Count -gt 0) { exit 1 }
}

if ($MyInvocation.InvocationName -ne '.') { Main }
