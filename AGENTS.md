<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Dev logs

Browser `console.*` appears in the dev terminal as `[browser]…` (`logging.browserToTerminal` in `next.config.ts`). `pnpm dev:log` tees the same stream to `dev-server.log`. For recent output: `tail -n 100 dev-server.log` (only after someone has run `pnpm dev:log`).
