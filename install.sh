#!/usr/bin/env bash
# Project Memory Agent (EMA) — One-Line Universal Installer
# Compatible with DeepSeek Harness, Claude Code, OpenCode, Codex.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/LoveDoLove/Project-Memory-Agent/main/install.sh | bash

set -e

REPO="LoveDoLove/Project-Memory-Agent"
BRANCH="${BRANCH:-main}"
RAW_BASE="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
PLUGIN_NAME="@lovedolove/dsh-project-memory"

# Colors
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${CYAN}${BOLD}"
echo "  ____            _           _     __  __                                "
echo " |  _ \ _ __ ___ (_) ___  ___| |_  |  \/  | ___ _ __ ___   ___  _ __ _   _ "
echo " | |_) | '__/ _ \| |/ _ \/ __| __| | |\/| |/ _ \ '_ \` _ \ / _ \| '__| | | |"
echo " |  __/| | | (_) | |  __/ (__| |_  | |  | |  __/ | | | | | (_) | |  | |_| |"
echo " |_|   |_|  \___// |\___|\___|\__| |_|  |_|\___|_| |_| |_|\___/|_|   \__, |"
echo "               |__/                                                  |___/ "
echo -e "${RESET}"
echo -e "${BOLD}Engineering Memory Agent (EMA) Installer — DeepSeek Harness Ready${RESET}\n"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${YELLOW}Warning: Node.js is not found on PATH. Node 18+ is required to run EMA.${RESET}"
else
  NODE_VER=$(node -v | tr -d 'v' | cut -d'.' -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js version is older than 18 (detected: $(node -v)). EMA requires Node 18+.${RESET}"
  else
    echo -e "  ✓ Node.js detected: $(node -v)"
  fi
fi

# 2. Setup Local Bin Directory
BIN_DIR="${HOME}/.local/bin"
mkdir -p "${BIN_DIR}"

# Download or create ema CLI runner
EMA_EXE="${BIN_DIR}/ema"
cat << 'EOF' > "${EMA_EXE}"
#!/usr/bin/env bash
# EMA CLI Launcher — Engineering Memory Agent

# 1. If running inside or near repository with bin/ema-cli.mjs
if [ -f "$(pwd)/bin/ema-cli.mjs" ]; then
  exec node "$(pwd)/bin/ema-cli.mjs" "$@"
elif [ -f "$(pwd)/dsh-plugin/bin/ema-cli.mjs" ]; then
  exec node "$(pwd)/dsh-plugin/bin/ema-cli.mjs" "$@"
fi

# 2. Check DSH profile installations
DSH_DIR="${HOME}/.dsh"
if [ -d "${DSH_DIR}/profiles" ]; then
  for profile_dir in "${DSH_DIR}/profiles"/*; do
    candidate="${profile_dir}/node_modules/@lovedolove/dsh-project-memory/bin/ema-cli.mjs"
    if [ -f "${candidate}" ]; then
      exec node "${candidate}" "$@"
    fi
  done
fi

# 3. Check npx fallback
if command -v npx >/dev/null 2>&1; then
  exec npx -y @lovedolove/dsh-project-memory ema "$@"
fi

echo "Error: Could not locate EMA CLI. Please ensure Node.js is installed." >&2
exit 1
EOF
chmod +x "${EMA_EXE}"
echo -e "  ✓ EMA CLI installed: ${CYAN}${EMA_EXE}${RESET}"

# 3. DeepSeek Harness (DSH) Setup
DSH_DIR="${HOME}/.dsh"
DSH_CONFIGURED=false

if command -v dsh >/dev/null 2>&1 || [ -d "${DSH_DIR}" ]; then
  echo -e "\n${BOLD}Configuring DeepSeek Harness (DSH)...${RESET}"

  # Find active DSH profile (default to 'web')
  PROFILE="web"
  if [ -d "${DSH_DIR}/profiles" ]; then
    for p in $(ls "${DSH_DIR}/profiles" 2>/dev/null); do
      if [ "$p" != "node_modules" ] && [ -d "${DSH_DIR}/profiles/$p" ]; then
        PROFILE="$p"
        break
      fi
    done
  fi

  # Install agent preset
  PRESET_DIR="${DSH_DIR}/.agent-presets/project-memory"
  mkdir -p "${PRESET_DIR}"
  curl -fsSL "${RAW_BASE}/agent.cordis.yml" -o "${PRESET_DIR}/agent.cordis.yml" 2>/dev/null || true
  curl -fsSL "${RAW_BASE}/preset.yml" -o "${PRESET_DIR}/preset.yml" 2>/dev/null || true
  echo -e "  ✓ Agent preset installed: ${PRESET_DIR}"

  # Mount plugin into DSH profile
  if command -v dsh >/dev/null 2>&1; then
    echo -e "  Installing plugin ${CYAN}${PLUGIN_NAME}${RESET} to DSH profile '${PROFILE}'..."
    dsh plugin --profile "${PROFILE}" add "${PLUGIN_NAME}" >/dev/null 2>&1 || true
    echo -e "  ✓ DSH plugin mounted on profile '${PROFILE}'"
    DSH_CONFIGURED=true
  fi
fi

# 4. Global Skill Mirroring (Claude Code, OpenCode, Codex, Global)
SKILLS_DIR="${HOME}/.agents/skills"
mkdir -p "${SKILLS_DIR}"

SKILLS=(
  "knowledge-classification"
  "knowledge-compounding"
  "knowledge-discovery"
  "memory-architecture"
  "memory-edit"
  "memory-verification"
  "obsolete-knowledge"
  "repository-audit"
)

echo -e "\n${BOLD}Installing Project Memory Skills...${RESET}"
for s in "${SKILLS[@]}"; do
  s_dir="${SKILLS_DIR}/${s}"
  mkdir -p "${s_dir}"
  curl -fsSL "${RAW_BASE}/skills/${s}/SKILL.md" -o "${s_dir}/SKILL.md" 2>/dev/null || true
done
echo -e "  ✓ 8 Core Skills installed to ${CYAN}${SKILLS_DIR}${RESET}"

# Also mirror to Claude Code if ~/.claude exists
if [ -d "${HOME}/.claude" ]; then
  mkdir -p "${HOME}/.claude/skills"
  for s in "${SKILLS[@]}"; do
    mkdir -p "${HOME}/.claude/skills/${s}"
    cp -f "${SKILLS_DIR}/${s}/SKILL.md" "${HOME}/.claude/skills/${s}/SKILL.md" 2>/dev/null || true
  done
  echo -e "  ✓ Skills mirrored to Claude Code (${HOME}/.claude/skills)"
fi

# Also mirror to OpenCode if ~/.config/opencode exists
if [ -d "${HOME}/.config/opencode" ]; then
  mkdir -p "${HOME}/.config/opencode/skills"
  for s in "${SKILLS[@]}"; do
    mkdir -p "${HOME}/.config/opencode/skills/${s}"
    cp -f "${SKILLS_DIR}/${s}/SKILL.md" "${HOME}/.config/opencode/skills/${s}/SKILL.md" 2>/dev/null || true
  done
  echo -e "  ✓ Skills mirrored to OpenCode (${HOME}/.config/opencode/skills)"
fi

# 5. Success Output
echo -e "\n${GREEN}${BOLD}========================================================================${RESET}"
echo -e "${GREEN}${BOLD}  ✨ Project Memory Agent (EMA) Installed Successfully!${RESET}"
echo -e "${GREEN}${BOLD}========================================================================${RESET}"

if [ "${DSH_CONFIGURED}" = true ]; then
  echo -e "\n${CYAN}${BOLD}🤖 Inside DeepSeek Harness:${RESET}"
  echo -e "   Just type ${BOLD}/ema${RESET} or ${BOLD}/project-memory${RESET} in any session chat."
  echo -e "   The agent will automatically manage, recall, and compound memory."
fi

echo -e "\n${CYAN}${BOLD}🌐 Interactive Visual Memory Graph:${RESET}"
echo -e "   Run ${BOLD}ema ui${RESET} in your project directory to launch the web graph"
echo -e "   at http://127.0.0.1:3888 (with force physics, contradictions, and drawer)."

echo -e "\n${CYAN}${BOLD}⚡ Auto-Distillation & Ingestion:${RESET}"
echo -e "   Run ${BOLD}ema ingest --git${RESET} to automatically capture git changes"
echo -e "   with grounded code anchors into the quarantined candidate queue."

echo -e "\n${CYAN}${BOLD}🔍 Authoritative Hybrid Recall:${RESET}"
echo -e "   Run ${BOLD}ema recall <query>${RESET} for FTS5 + sqlite-vec hybrid search."

if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
  echo -e "\n${YELLOW}Note: Ensure ${BIN_DIR} is in your PATH:${RESET}"
  echo -e "  export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo ""
