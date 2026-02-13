# OktaClaw Hardened Install Guide (Windows + WSL2 + Docker + VS Code + Telegram)

`OktaClaw` is this hardened fork/release profile.  
Core CLI/env/runtime keys in code still use `openclaw` naming for compatibility.

## 1) Analysis Conclusions

1. OpenClaw codebase already supports plugin allowlisting, so we can run Telegram-only without loading other channels/plugins.
2. OpenClaw ACP bridge (`openclaw acp`) works for IDE integration; in current source it explicitly ignores incoming `mcpServers` payloads (`openclaw/src/acp/translator.ts`).
3. To reduce attack surface, I added code-level hardening toggles so high-risk Gateway APIs can be disabled at runtime.
4. I also added a channel allowlist environment control so only explicitly allowed channels are visible/loaded.

## 2) Code Modifications Applied

These files were added/modified:

1. `openclaw/src/channels/plugins/index.ts`
2. `openclaw/src/gateway/server-methods.ts`
3. `openclaw/src/gateway/server-methods-list.ts`
4. `openclaw/deploy/hardened/docker-compose.hardened.yml`
5. `openclaw/deploy/hardened/openclaw.hardened.json5`
6. `openclaw/deploy/hardened/.env.hardened.example`

### What changed

1. Added `OPENCLAW_CHANNEL_ALLOWLIST` (comma-separated, e.g. `telegram`) to enforce channel filtering.
2. Added runtime API disable flags:
   - `OPENCLAW_DISABLE_BROWSER_API=0` (enabled by default for browser-based testing)
   - `OPENCLAW_DISABLE_SKILLS_API=1`
   - `OPENCLAW_DISABLE_WIZARD_API=1`
   - `OPENCLAW_DISABLE_UPDATE_API=1`
   - `OPENCLAW_DISABLE_TTS_API=1`
   - `OPENCLAW_DISABLE_TALK_API=1`
   - `OPENCLAW_DISABLE_CRON_API=1`
   - `OPENCLAW_DISABLE_NODES_API=1`
   - `OPENCLAW_DISABLE_EXEC_APPROVALS_API=0` (enabled by default for coding approval flows)
   - `OPENCLAW_DISABLE_VOICEWAKE_API=1`
   - `OPENCLAW_DISABLE_DEVICE_API=1`
3. Added a hardened compose profile and hardened config template with Telegram-only plugin policy and browser testing enabled.

## 3) Prerequisites (Windows)

1. Install WSL2 + Ubuntu.
2. Install Docker Desktop and enable WSL integration for your Ubuntu distro.
3. Install VS Code on Windows.
4. Confirm from WSL:

```bash
wsl -d Ubuntu
cd ~/path/to/OKtavius/openclaw
docker version
docker compose version
```

## 4) Prepare Hardened Runtime Files

From WSL inside `openclaw/`:

```bash
mkdir -p deploy/hardened/state
cp deploy/hardened/.env.hardened.example deploy/hardened/.env.hardened
cp deploy/hardened/openclaw.hardened.json5 deploy/hardened/state/openclaw.json
```

Edit `deploy/hardened/.env.hardened`:

1. Set `OPENCLAW_GATEWAY_TOKEN` to a random value.
2. Set `TELEGRAM_BOT_TOKEN` from BotFather.
3. Confirm `OPENCLAW_STATE_DIR=./deploy/hardened/state`.

If `OPENCLAW_STATE_DIR` is different, keep it aligned with your folder path.

## 5) Build and Start

From `openclaw/`:

```bash
docker build -t oktaclaw:local .
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml up -d oktaclaw-gateway
```

Health check:

```bash
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml logs -f oktaclaw-gateway
```

## 6) Telegram Lockdown Setup

In `deploy/hardened/state/openclaw.json`:

1. Keep `dmPolicy: "pairing"`.
2. Keep `groupPolicy: "allowlist"`.
3. Add explicit group IDs under `channels.telegram.groups`.
4. Set `requireMention: true` for groups unless you intentionally want always-on group replies.

Then restart:

```bash
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml restart oktaclaw-gateway
```

## 7) Verify No Extra Plugins/Skills

Run these checks:

```bash
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml exec -T oktaclaw-gateway node openclaw.mjs plugins list
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml exec -T oktaclaw-gateway node openclaw.mjs channels status --probe
```

Expected result:

1. Telegram plugin available.
2. No non-telegram channels active.
3. Skills install/update APIs disabled by env flags.

## 8) VS Code MCP/ACP Wiring (Windows -> WSL)

Because the OpenClaw IDE bridge is ACP, wire VS Code MCP/custom-server entry to launch ACP over stdio via WSL.

Use this command shape in your MCP server config:

```json
{
  "mcpServers": {
    "oktaclaw-acp": {
      "command": "wsl.exe",
      "args": [
        "-d",
        "Ubuntu",
        "--",
        "bash",
        "-lc",
        "cd ~/path/to/OKtavius/openclaw && docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml run --rm --no-deps oktaclaw-acp"
      ]
    }
  }
}
```

Notes:

1. Keep Gateway running (`oktaclaw-gateway` service up).
2. `oktaclaw-acp` service uses the same token and connects internally to `ws://127.0.0.1:18789`.
3. This keeps all traffic local to your machine.

## 9) Security Checklist

1. Keep Gateway bound to loopback only.
2. Never expose `18789` publicly.
3. Rotate `OPENCLAW_GATEWAY_TOKEN` if leaked.
4. Keep Telegram group allowlist explicit.
5. Keep `OPENCLAW_CHANNEL_ALLOWLIST=telegram`.
6. Keep `OPENCLAW_BUNDLED_SKILLS_DIR` pointing to an empty/nonexistent path.
7. Keep nonessential API disable flags enabled.
8. Keep `browser.evaluateEnabled=false` unless you explicitly need JS evaluation.
9. If you need strictest mode with no approvals workflow, set `OPENCLAW_DISABLE_EXEC_APPROVALS_API=1`.
10. If you need strictest mode with no browser tooling, set `OPENCLAW_DISABLE_BROWSER_API=1`.

## 10) Operational Commands

Start:

```bash
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml up -d oktaclaw-gateway
```

Stop:

```bash
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml down
```

Upgrade (same hardening profile):

```bash
docker build -t oktaclaw:local .
docker compose --env-file deploy/hardened/.env.hardened -f deploy/hardened/docker-compose.hardened.yml up -d --force-recreate oktaclaw-gateway
```
