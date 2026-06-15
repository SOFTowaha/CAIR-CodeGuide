#!/usr/bin/env bash
# setup-cair-linter.sh
# Sets up the CAIR-recommended VS Code extensions and workspace settings
# for Python projects. Run once from your project root.
#
# Usage:
#   chmod +x setup-cair-linter.sh
#   ./setup-cair-linter.sh

set -euo pipefail

# ── Colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()     { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── Check for VS Code CLI ───────────────────────────────────────────────────
if ! command -v code &>/dev/null; then
  warn "'code' command not found."
  warn "Open VS Code → Command Palette → 'Shell Command: Install code command in PATH', then re-run."
  VSCODE_AVAILABLE=false
else
  VSCODE_AVAILABLE=true
fi

# ── Install VS Code extensions ──────────────────────────────────────────────
if [ "$VSCODE_AVAILABLE" = true ]; then
  info "Installing VS Code extensions…"

  EXTENSIONS=(
    "charliermarsh.ruff"           # ruff — fast Python linter + formatter
    "ms-python.mypy-type-checker"  # mypy — static type checking
    "ms-python.python"             # Python language support
    "ms-python.vscode-pylance"     # Pylance — fast IntelliSense
    "tamasfe.even-better-toml"     # TOML syntax support (pyproject.toml)
    "redhat.vscode-yaml"           # YAML support (CI configs)
    "ms-azuretools.vscode-docker"  # Docker / Containerfile support
    "GitHub.vscode-pull-request-github"  # GitHub PRs in editor
  )

  for ext in "${EXTENSIONS[@]}"; do
    if code --install-extension "$ext" --force &>/dev/null; then
      success "Installed $ext"
    else
      warn "Could not install $ext — install manually from Extensions panel"
    fi
  done
fi

# ── Create .vscode/settings.json ────────────────────────────────────────────
VSCODE_DIR=".vscode"
SETTINGS_FILE="$VSCODE_DIR/settings.json"
mkdir -p "$VSCODE_DIR"

if [ -f "$SETTINGS_FILE" ]; then
  info "$SETTINGS_FILE already exists — writing to $VSCODE_DIR/cair-settings.json instead"
  SETTINGS_FILE="$VSCODE_DIR/cair-settings.json"
fi

cat > "$SETTINGS_FILE" << 'JSON'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "charliermarsh.ruff",
  "editor.codeActionsOnSave": {
    "source.fixAll.ruff": "explicit",
    "source.organizeImports.ruff": "explicit"
  },
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.tabSize": 4,
    "editor.insertSpaces": true
  },
  "python.analysis.typeCheckingMode": "basic",
  "mypy-type-checker.args": [
    "--ignore-missing-imports",
    "--warn-return-any",
    "--warn-unused-configs"
  ],
  "ruff.enable": true,
  "ruff.fixAll": true,
  "ruff.organizeImports": true,
  "python.terminal.activateEnvironment": true,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "editor.rulers": [100]
}
JSON
success "Written $SETTINGS_FILE"

# ── Create pyproject.toml stanza (if not present) ───────────────────────────
PYPROJECT="pyproject.toml"
if [ ! -f "$PYPROJECT" ]; then
  info "Creating $PYPROJECT with ruff and mypy config…"
  cat > "$PYPROJECT" << 'TOML'
[tool.ruff]
target-version = "py312"
line-length    = 100

[tool.ruff.lint]
select  = ["E", "F", "I", "UP", "B", "SIM"]
ignore  = []
fixable = ["ALL"]

[tool.ruff.format]
quote-style               = "double"
indent-style              = "space"
skip-magic-trailing-comma = false

[tool.mypy]
python_version        = "3.12"
ignore_missing_imports = true
warn_return_any       = true
warn_unused_configs   = true
TOML
  success "Created $PYPROJECT"
else
  info "$PYPROJECT already exists — add the following sections manually if missing:"
  echo ""
  echo "  [tool.ruff]"
  echo "  target-version = \"py312\""
  echo "  line-length    = 100"
  echo ""
  echo "  [tool.mypy]"
  echo "  python_version        = \"3.12\""
  echo "  ignore_missing_imports = true"
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}────────────────────────────────────────────${NC}"
echo -e "${GREEN} CAIR linter setup complete!${NC}"
echo -e "${GREEN}────────────────────────────────────────────${NC}"
echo ""
echo "  Formatter  → ruff (runs on save)"
echo "  Linter     → ruff (E, F, I, UP, B, SIM rules)"
echo "  Types      → mypy (basic mode)"
echo ""
echo "  To run manually:"
echo "    ruff check .           # lint"
echo "    ruff format .          # format"
echo "    mypy .                 # type-check"
echo ""
info "Reload VS Code (Cmd/Ctrl+Shift+P → 'Developer: Reload Window') to activate."
