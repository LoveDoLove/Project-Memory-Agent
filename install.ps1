param(
    [string]$Target = '',
    [switch]$Force,
    [switch]$Verify,
    [string]$Branch = 'main'
)

$Repo = 'LoveDoLove/Project-Memory-Agent'
$Base = "https://raw.githubusercontent.com/$Repo/$Branch"
$Skills = @('knowledge-classification','knowledge-compounding','knowledge-discovery','memory-architecture','memory-edit','memory-verification','obsolete-knowledge','repository-audit')
$AgentMd = 'agents/project-memory.md'
$AgentToml = 'agents/project-memory.toml'

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

function Main {
    $script:Installed = @()
    $script:Failures = @()

    $targets = @()
    if (-not $Target) {
        if ([Console]::IsInputRedirected) {
            $targets = @('all')
        } else {
            Write-Host "Select target:"
            Write-Host "  1 OpenCode  2 Codex  3 Claude  4 DSH  5 All  Q Quit"
            try { $choice = Read-Host "Choice" } catch { $choice = '5' }
            if ($choice -eq 'Q' -or $choice -eq 'q') { return }
            if ($choice -eq '1') { $targets = @('opencode') }
            elseif ($choice -eq '2') { $targets = @('codex') }
            elseif ($choice -eq '3') { $targets = @('claude') }
            elseif ($choice -eq '4') { $targets = @('dsh') }
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
            'dsh' {
                $profileDir = Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles'
                $profileName = 'project-memory'
                $profilePath = Join-Path $profileDir $profileName
                if ((Test-Path $profilePath) -and -not $Force) {
                    $ans = Read-Host "DSH profile already exists at $profilePath. Overwrite? [Y/N]"
                    if ($ans -notmatch '^[Yy]') { Write-Host "  skipped: dsh profile"; continue }
                }
                # Copy plugin files to the profile so they are available offline.
                $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
                $pluginSrc = Join-Path $scriptDir 'dsh-plugin'
                if (-not (Test-Path $pluginSrc)) {
                    # Running from a subdirectory or extracted archive â€” walk up.
                    $pluginSrc = Join-Path (Split-Path $scriptDir) 'Project-Memory-Agent\dsh-plugin'
                }
                if (-not (Test-Path (Join-Path $pluginSrc 'package.json'))) {
                    Write-Warning "  dsh-plugin not found at $pluginSrc; skip DSH (requires running from repo root or extracting the zip)."
                    continue
                }
                if ($Verify) {
                    Write-Host "  would install DSH profile: $profilePath"
                    $script:Installed += $profilePath
                    continue
                }
                New-Item -ItemType Directory -Force -Path $profilePath | Out-Null
                $pluginDest = Join-Path $profilePath 'node_modules\@lovedolove\dsh-plugin'
                if ((Test-Path $pluginDest) -and -not $Force) {
                    $ans = Read-Host "Overwrite DSH plugin at $pluginDest ? [Y/N]"
                    if ($ans -notmatch '^[Yy]') { Write-Host "  skipped: DSH plugin"; continue }
                }
                Copy-Item -Recurse -Force $pluginSrc $pluginDest
                Write-Host "  installed DSH plugin: $pluginDest"
                $script:Installed += $pluginDest
                # Write profile manifest manually (mirrors `dsh plugin --profile ... install`).
                $manifest = @{
                    name = "dsh-profile-$profileName"
                    private = $true
                    dependencies = @{
                        "@deepseek-ai/dsh-base" = "*"
                        "@lovedolove/dsh-project-memory" = "file:./node_modules/@lovedolove/dsh-project-memory"
                    }
                    dsh = @{
                        profile = @{
                            bundles = @('@deepseek-ai/dsh-base', "@lovedolove/dsh-project-memory")
                            patchReload = "live"
                        }
                    }
                }
                $manifestPath = Join-Path $profilePath 'package.json'
                if (-not (Test-Path $manifestPath) -or $Force) {
                    $manifest | ConvertTo-Json -Depth 10 | Out-File -FilePath $manifestPath -Encoding utf8
                    Write-Host "  wrote profile manifest: $manifestPath"
                    $script:Installed += $manifestPath
                }
                $patchPath = Join-Path $profilePath 'cordis.patch.yml'
                if (-not (Test-Path $patchPath)) {
                    @"
# Project Memory DSH profile â€” your patch layer.
# Applied after every bundle layer. Customize here to override settings.
[]
"@ | Out-File -FilePath $patchPath -Encoding utf8
                    Write-Host "  wrote profile patch: $patchPath"
                    $script:Installed += $patchPath
                }
                $workspacePath = Join-Path $profilePath 'pnpm-workspace.yaml'
                if (-not (Test-Path $workspacePath)) {
                    @"
packages:
  - .

nodeLinker: hoisted
autoInstallPeers: false
"@ | Out-File -FilePath $workspacePath -Encoding utf8
                    Write-Host "  wrote pnpm-workspace: $workspacePath"
                    $script:Installed += $workspacePath
                }
                # Direct users to GitHub Packages for the online install path.
                # Without this, `dsh plugin install @lovedolove/dsh-project-memory`
                # hits npmjs.org and 404s. The token is already configured globally
                # by the user via `npm config set //npm.pkg.github.com/:_authToken …`
                # or by the DSH setup wizard; if missing the install will 401.
                $npmrcPath = Join-Path $profilePath '.npmrc'
                if (-not (Test-Path $npmrcPath)) {
                    @"
@lovedolove:registry=https://npm.pkg.github.com
"@ | Out-File -FilePath $npmrcPath -Encoding utf8
                    Write-Host "  wrote .npmrc (points @lovedolove scope to GitHub Packages)"
                    $script:Installed += $npmrcPath
                }
            }
            'all' {
                Install-Skills "$env:USERPROFILE\.claude\skills"
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.claude\agents\project-memory.md"
                Install-Agent $AgentMd "$env:USERPROFILE\.config\opencode\agents\project-memory.md"
                Install-Agent $AgentToml "$env:USERPROFILE\.codex\agents\project-memory.toml"
                # DSH is also installed in 'all' mode.
                $dshProfileDir = Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles'
                $dshProfileName = 'project-memory'
                $dshProfilePath = Join-Path $dshProfileDir $dshProfileName
                $dshPluginSrc = Join-Path $scriptDir 'dsh-plugin'
                if (-not (Test-Path $dshPluginSrc)) {
                    $dshPluginSrc = Join-Path (Split-Path $scriptDir) 'Project-Memory-Agent\dsh-plugin'
                }
                if (Test-Path (Join-Path $dshPluginSrc 'package.json')) {
                    if (-not (Test-Path $dshProfilePath) -or $Force) {
                        if ($Verify) {
                            Write-Host "  would install DSH profile: $dshProfilePath"
                        } else {
                            New-Item -ItemType Directory -Force -Path $dshProfilePath | Out-Null
                            $dshPluginDest = Join-Path $dshProfilePath 'node_modules\@lovedolove\dsh-plugin'
                            Copy-Item -Recurse -Force $dshPluginSrc $dshPluginDest
                            $script:Installed += $dshPluginDest
                            $manifest = @{
                                name = "dsh-profile-$dshProfileName"
                                private = $true
                                dependencies = @{
                                    "@deepseek-ai/dsh-base" = "*"
                                    "@lovedolove/dsh-project-memory" = "file:./node_modules/@lovedolove/dsh-project-memory"
                                }
                                dsh = @{
                                    profile = @{
                                        bundles = @('@deepseek-ai/dsh-base', "@lovedolove/dsh-project-memory")
                                        patchReload = "live"
                                    }
                                }
                            }
                            $manifestPath = Join-Path $dshProfilePath 'package.json'
                            if (-not (Test-Path $manifestPath) -or $Force) {
                                $manifest | ConvertTo-Json -Depth 10 | Out-File -FilePath $manifestPath -Encoding utf8
                                $script:Installed += $manifestPath
                            }
                            $patchPath = Join-Path $dshProfilePath 'cordis.patch.yml'
                            if (-not (Test-Path $patchPath)) {
                                @"
# Project Memory DSH profile â€” your patch layer.
# Applied after every bundle layer. Customize here to override settings.
[]
"@ | Out-File -FilePath $patchPath -Encoding utf8
                                $script:Installed += $patchPath
                            }
                            $workspacePath = Join-Path $dshProfilePath 'pnpm-workspace.yaml'
                            if (-not (Test-Path $workspacePath)) {
                                @"
packages:
  - .

nodeLinker: hoisted
autoInstallPeers: false
"@ | Out-File -FilePath $workspacePath -Encoding utf8
                                $script:Installed += $workspacePath
                            }
                            # Direct users to GitHub Packages for the online install path.
                            $npmrcPath = Join-Path $dshProfilePath '.npmrc'
                            if (-not (Test-Path $npmrcPath)) {
                                @"
@lovedolove:registry=https://npm.pkg.github.com
"@ | Out-File -FilePath $npmrcPath -Encoding utf8
                                $script:Installed += $npmrcPath
                            }
                        }
                    }
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
    Write-Host 'Codex users: to spawn this agent you may need `[features] multi_agent = true` in `~/.codex/config.toml` (not auto-applied).'
    Write-Host ''
    Write-Host 'DSH users: start the profile with `dsh --profile project-memory` (web GUI) or'
    Write-Host "  `dsh --profile project-memory headless "your task"`. Skills live in"
    Write-Host "  `~/.dsh/profiles/project-memory/node_modules/@lovedolove/dsh-project-memory`."
    Write-Host '  To use the online profile (recommends `dsh plugin` for updates):'
    Write-Host '    dsh plugin --profile project-memory install @lovedolove/dsh-project-memory'
    if ($script:Failures.Count -gt 0) { exit 1 }
}

if ($MyInvocation.InvocationName -ne '.') { Main }

