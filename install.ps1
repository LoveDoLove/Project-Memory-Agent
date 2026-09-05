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

# Find or create the DSH profile to integrate into.
function Resolve-DshProfile {
    param([string]$ProfileName)
    $profileDir = Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles'
    # If user explicitly specified a profile, use it.
    if ($ProfileName) {
        $path = Join-Path $profileDir $ProfileName
        if (Test-Path $path) { return @{ Path = $path; Name = $ProfileName; Created = $false } }
        if ($Verify) { Write-Host "  would create DSH profile: $path" }
        return @{ Path = $path; Name = $ProfileName; Created = $true }
    }
    # Auto-detect: prefer 'web' (existing main profile), else any profile, else create 'project-memory'.
    $candidates = @('web') + @(Get-ChildItem $profileDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'node_modules' } | Select-Object -ExpandProperty Name)
    $candidates = $candidates | Select-Object -Unique
    foreach ($c in $candidates) {
        if (Test-Path (Join-Path $profileDir $c)) { return @{ Path = Join-Path $profileDir $c; Name = $c; Created = $false } }
    }
    $fallback = Join-Path $profileDir 'project-memory'
    if ($Verify) { Write-Host "  no existing DSH profile found; would create: $fallback" }
    return @{ Path = $fallback; Name = 'project-memory'; Created = $true }
}

function Add-Plugin-ToProfile {
    param(
        [string]$ProfilePath,
        [string]$PluginName,
        [switch]$InstallOffline,
        [string]$PluginSrc
    )
    # Ensure cordis.patch.yml exists and has our skill-filesystem patch.
    $patchPath = Join-Path $ProfilePath 'cordis.patch.yml'
    $patchContent = @"
# Project Memory: register the skills/ directory as a custom skill root.
# Applied after dsh-base which mounts skill-filesystem with defaults.
- id: skill-filesystem
  config:
    customSkillDirs:
      - ../skills
    includeDefaultRoots: true
"@
    $patchExists = Test-Path $patchPath
    if ($patchExists) {
        $existingPatch = Get-Content $patchPath -Raw
        if ($existingPatch -match 'skill-filesystem') {
            Write-Host "  cordis.patch.yml already has skill-filesystem patch"
        } else {
            # Merge: append our entry to the existing patch array.
            if ($existingPatch -match '^\[\s*$') {
                $patchContent = $existingPatch.TrimEnd() + "`n- id: skill-filesystem`n  config:`n    customSkillDirs:`n      - ../skills`n    includeDefaultRoots: true"
            } else {
                $patchContent = $existingPatch.TrimEnd() + "`n" + $patchContent
            }
            if (-not $Verify) {
                $patchContent | Out-File -FilePath $patchPath -Encoding utf8
                Write-Host "  updated cordis.patch.yml with skill-filesystem"
                $script:Installed += $patchPath
            } else {
                Write-Host "  would update cordis.patch.yml"
                $script:Installed += $patchPath
            }
        }
    } else {
        if (-not $Verify) {
            $patchContent | Out-File -FilePath $patchPath -Encoding utf8
            Write-Host "  wrote cordis.patch.yml with skill-filesystem"
            $script:Installed += $patchPath
        } else {
            Write-Host "  would write cordis.patch.yml"
            $script:Installed += $patchPath
        }
    }

    # Ensure pnpm-workspace.yaml exists.
    $workspacePath = Join-Path $ProfilePath 'pnpm-workspace.yaml'
    if (-not (Test-Path $workspacePath)) {
        if (-not $Verify) {
            @"
packages:
  - .

nodeLinker: hoisted
autoInstallPeers: false
"@ | Out-File -FilePath $workspacePath -Encoding utf8
            Write-Host "  wrote pnpm-workspace.yaml"
            $script:Installed += $workspacePath
        } else {
            Write-Host "  would write pnpm-workspace.yaml"
            $script:Installed += $workspacePath
        }
    }

    # Install the plugin.
    if ($InstallOffline -and $PluginSrc) {
        # PluginName = '@lovedolove/dsh-project-memory' → node_modules/@lovedolove/dsh-project-memory
        $scope, $pkg = $PluginName -split '/', 2
        $pluginDest = Join-Path $ProfilePath "node_modules\$scope\$pkg"
        if (-not $Verify) {
            if ((Test-Path $pluginDest) -and -not $Force) {
                $ans = Read-Host "Overwrite DSH plugin at $pluginDest ? [Y/N]"
                if ($ans -match '^[Yy]') { Copy-Item -Recurse -Force $PluginSrc $pluginDest }
                else { Write-Host "  skipped: DSH plugin"; return }
            } else {
                Copy-Item -Recurse -Force $PluginSrc $pluginDest
                Write-Host "  installed DSH plugin (offline): $pluginDest"
            }
            $script:Installed += $pluginDest
        }
    }

    # Ensure package.json has the plugin in bundles + dependencies.
    $manifestPath = Join-Path $ProfilePath 'package.json'
    if (Test-Path $manifestPath) {
        $pkg = Get-Content $manifestPath -Raw | ConvertFrom-Json
    } else {
        $pkg = [PSCustomObject]@{ name = "dsh-profile-$(Resolve-DshProfile).Name"; private = $true }
    }
    $pkg | Add-Member -NotePropertyName 'dsh' -NotePropertyValue @{
        profile = [PSCustomObject]@{
            bundles = @()
            patchReload = "live"
        }
    } -Force

    # Build bundles list: start from existing bundles + base, ensure plugin is included.
    $existingBundles = @()
    if ($pkg.dsh.profile.bundles) { $existingBundles = @($pkg.dsh.profile.bundles) }
    $allBundles = @('@deepseek-ai/dsh-base') + $existingBundles
    if ($allBundles -notcontains $PluginName) { $allBundles += $PluginName }
    $allBundles = $allBundles | Select-Object -Unique
    $pkg.dsh.profile.bundles = $allBundles

    # Add to dependencies (for pnpm to resolve).
    if (-not $pkg.dependencies) { $pkg | Add-Member -NotePropertyName 'dependencies' -NotePropertyValue @{} }
    $pkg.dependencies[$PluginName] = "^0.3.0"

    if (-not $Verify) {
        $pkg | ConvertTo-Json -Depth 10 | Out-File -FilePath $manifestPath -Encoding utf8
        Write-Host "  updated package.json in $ProfilePath"
        $script:Installed += $manifestPath
    } else {
        Write-Host "  would update package.json in $ProfilePath"
        $script:Installed += $manifestPath
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
                $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
                $pluginSrc = Join-Path $scriptDir 'dsh-plugin'
                if (-not (Test-Path $pluginSrc)) {
                    $pluginSrc = Join-Path (Split-Path $scriptDir) 'Project-Memory-Agent\dsh-plugin'
                }
                $hasPlugin = Test-Path (Join-Path $pluginSrc 'package.json')

                $resolved = Resolve-DshProfile -ProfileName $DshProfile
                $profilePath = $resolved.Path
                $profileName = $resolved.Name
                $isCreated = $resolved.Created

                Write-Host "  DSH profile: $profilePath ($profileName)"

                if ($isCreated -and -not $Verify) {
                    New-Item -ItemType Directory -Force -Path $profilePath | Out-Null
                    Write-Host "  created profile: $profilePath"
                }

                # Install plugin: offline copy if source available, otherwise suggest npm install.
                if ($hasPlugin) {
                    Add-Plugin-ToProfile -ProfilePath $profilePath -PluginName $PluginName -InstallOffline:$true -PluginSrc $pluginSrc
                } else {
                    Add-Plugin-ToProfile -ProfilePath $profilePath -PluginName $PluginName -InstallOffline:$false
                    Write-Host ""
                    Write-Host "  Plugin not found locally; install from npm:"
                    Write-Host "    dsh plugin --profile $profileName add $PluginName"
                }
            }
            'all' {
                Install-Skills "$env:USERPROFILE\.claude\skills"
                Install-Skills "$env:USERPROFILE\.agents\skills"
                Install-Agent $AgentMd "$env:USERPROFILE\.claude\agents\project-memory.md"
                Install-Agent $AgentMd "$env:USERPROFILE\.config\opencode\agents\project-memory.md"
                Install-Agent $AgentToml "$env:USERPROFILE\.codex\agents\project-memory.toml"
                # DSH in 'all' mode: integrate into existing profile (or create if none).
                $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
                $pluginSrc = Join-Path $scriptDir 'dsh-plugin'
                if (-not (Test-Path $pluginSrc)) {
                    $pluginSrc = Join-Path (Split-Path $scriptDir) 'Project-Memory-Agent\dsh-plugin'
                }
                $resolved = Resolve-DshProfile -ProfileName $DshProfile
                $profilePath = $resolved.Path
                $profileName = $resolved.Name
                Write-Host "  DSH profile: $profilePath ($profileName)"
                $hasPlugin = Test-Path (Join-Path $pluginSrc 'package.json')
                if ($hasPlugin) {
                    Add-Plugin-ToProfile -ProfilePath $profilePath -PluginName $PluginName -InstallOffline:$true -PluginSrc $pluginSrc
                } else {
                    Add-Plugin-ToProfile -ProfilePath $profilePath -PluginName $PluginName -InstallOffline:$false
                    Write-Host "    dsh plugin --profile $profileName add $PluginName"
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
    if ($DshProfile) {
        Write-Host "DSH plugin integrated into profile '$DshProfile'."
    } else {
        Write-Host 'DSH plugin integrated. To use:'
        Write-Host "  dsh --profile <your-profile>        # web GUI"
        Write-Host "  dsh --profile <your-profile> headless `"your task`""
    }
    if ($script:Failures.Count -gt 0) { exit 1 }
}

if ($MyInvocation.InvocationName -ne '.') { Main }
