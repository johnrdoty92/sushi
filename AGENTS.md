# AGENTS.md

Sushi: a multiplayer game planned as a React frontend and Go WebSocket server. Both halves are currently scaffolds, not working features.

## Layout

- `frontend/` — React 19 + Vite 8 + TypeScript 7. Entry: `src/main.tsx` → `src/App.tsx`.
- `server/` — Go 1.24, module `github.com/johnrdoty92/sushi/server`. Entry: `cmd/server/main.go`; server code belongs in `internal/server/`.
- No root manifest, Makefile, or workspace config. Run all commands from the relevant subdirectory.

## Commands

Frontend (from `frontend/`, uses pnpm per `pnpm-lock.yaml`):

- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b && vite build`; this is the working typecheck/build check
- `pnpm lint` — **currently fails before linting**: typescript-eslint 8.72 rejects TypeScript 7.0 (`typescript-eslint does not support TS 7.0`). Do not treat this as a code error; lint cannot run until TypeScript is downgraded to 6.x or typescript-eslint adds TS 7 support.

Server (from `server/`):

- `go run ./cmd/server`, `go build ./...`, `go vet ./...` — **currently fail** because `cmd/server/main.go` declares `package main` but has no `func main`.
- `go test ./...` — succeeds; there are no tests.

There is no CI for build, lint, or tests; only release-please runs.

## Gotchas

- The server files contain only package declarations, and `App.tsx` is still Vite template markup. Check for existing implementation before assuming behavior.
- `vite.config.ts` has no proxy, so the frontend is not wired to the Go server yet.
- TypeScript uses `verbatimModuleSyntax` and `allowImportingTsExtensions`: keep explicit `.tsx` extensions in imports (e.g. `import App from "./App.tsx"`), and use `import type` for type-only imports.
- `noUnusedLocals` and `noUnusedParameters` are enabled and fail the build.
- CSS uses native nesting in `src/App.css` and `src/index.css`.

## Releases

- `.github/workflows/release-please.yml` runs release-please on every push to `main`.
- `frontend` (node) and `server` (go) release independently with separate PRs; versions in `.release-please-manifest.json` start at `0.0.0`.
- Use Conventional Commits (`feat:`, `fix:`, etc.) — release-please derives version bumps and changelogs from commit messages.
