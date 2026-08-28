# Lessons

Generalizable insights verified against this repository. Each has a root
cause and future guidance — not incident reports.

## Read When

- Writing or editing `install.tests.ps1` → [pester-3-4-legacy-syntax.md](./pester-3-4-legacy-syntax.md)
- Writing PowerShell path logic → [join-path-two-positional-args.md](./join-path-two-positional-args.md)
- Choosing a skills directory for OpenCode on Windows → [opencode-windows-agents-skills.md](./opencode-windows-agents-skills.md)

## Index

| Lesson | One line |
|---|---|
| [Pester 3.4.0 legacy syntax](./pester-3-4-legacy-syntax.md) | Windows PowerShell ships Pester 3.4.0 — `Should Be`, not `Should -Be`; Mock needs explicit `param($Uri,$OutFile)` |
| [Join-Path takes 2 positional args](./join-path-two-positional-args.md) | `Join-Path a b c` throws ParameterBindingException — nest calls |
| [OpenCode Windows + ~/.agents/skills](./opencode-windows-agents-skills.md) | OpenCode on Windows does not resolve `~/.agents/skills` — use `~/.claude/skills` or `~/.config/opencode/skills` |
