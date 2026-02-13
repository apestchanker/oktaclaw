import { listChannelPlugins } from "../channels/plugins/index.js";
import { isTruthyEnvValue } from "../infra/env.js";

const BASE_METHODS = [
  "health",
  "logs.tail",
  "channels.status",
  "channels.logout",
  "status",
  "usage.status",
  "usage.cost",
  "tts.status",
  "tts.providers",
  "tts.enable",
  "tts.disable",
  "tts.convert",
  "tts.setProvider",
  "config.get",
  "config.set",
  "config.apply",
  "config.patch",
  "config.schema",
  "exec.approvals.get",
  "exec.approvals.set",
  "exec.approvals.node.get",
  "exec.approvals.node.set",
  "exec.approval.request",
  "exec.approval.waitDecision",
  "exec.approval.resolve",
  "wizard.start",
  "wizard.next",
  "wizard.cancel",
  "wizard.status",
  "talk.config",
  "talk.mode",
  "models.list",
  "agents.list",
  "agents.create",
  "agents.update",
  "agents.delete",
  "agents.files.list",
  "agents.files.get",
  "agents.files.set",
  "skills.status",
  "skills.bins",
  "skills.install",
  "skills.update",
  "update.run",
  "voicewake.get",
  "voicewake.set",
  "sessions.list",
  "sessions.preview",
  "sessions.patch",
  "sessions.reset",
  "sessions.delete",
  "sessions.compact",
  "last-heartbeat",
  "set-heartbeats",
  "wake",
  "node.pair.request",
  "node.pair.list",
  "node.pair.approve",
  "node.pair.reject",
  "node.pair.verify",
  "device.pair.list",
  "device.pair.approve",
  "device.pair.reject",
  "device.token.rotate",
  "device.token.revoke",
  "node.rename",
  "node.list",
  "node.describe",
  "node.invoke",
  "node.invoke.result",
  "node.event",
  "cron.list",
  "cron.status",
  "cron.add",
  "cron.update",
  "cron.remove",
  "cron.run",
  "cron.runs",
  "system-presence",
  "system-event",
  "send",
  "agent",
  "agent.identity.get",
  "agent.wait",
  "browser.request",
  // WebChat WebSocket-native chat methods
  "chat.history",
  "chat.abort",
  "chat.send",
];

export function listGatewayMethods(): string[] {
  const methods = filterDisabledMethods(BASE_METHODS);
  const channelMethods = listChannelPlugins().flatMap((plugin) => plugin.gatewayMethods ?? []);
  return Array.from(new Set([...methods, ...channelMethods]));
}

export const GATEWAY_EVENTS = [
  "connect.challenge",
  "agent",
  "chat",
  "presence",
  "tick",
  "talk.mode",
  "shutdown",
  "health",
  "heartbeat",
  "cron",
  "node.pair.requested",
  "node.pair.resolved",
  "node.invoke.request",
  "device.pair.requested",
  "device.pair.resolved",
  "voicewake.changed",
  "exec.approval.requested",
  "exec.approval.resolved",
];

function featureDisabled(flag: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const profile = env.OPENCLAW_SECURITY_PROFILE?.trim().toLowerCase();
  if (profile === "minimal") {
    return true;
  }
  return isTruthyEnvValue(env[flag]);
}

function filterDisabledMethods(methods: string[], env: NodeJS.ProcessEnv = process.env): string[] {
  const blocked = new Set<string>();

  if (featureDisabled("OPENCLAW_DISABLE_BROWSER_API", env)) {
    blocked.add("browser.request");
  }
  if (featureDisabled("OPENCLAW_DISABLE_SKILLS_API", env)) {
    blocked.add("skills.status");
    blocked.add("skills.bins");
    blocked.add("skills.install");
    blocked.add("skills.update");
  }
  if (featureDisabled("OPENCLAW_DISABLE_WIZARD_API", env)) {
    blocked.add("wizard.start");
    blocked.add("wizard.next");
    blocked.add("wizard.cancel");
    blocked.add("wizard.status");
  }
  if (featureDisabled("OPENCLAW_DISABLE_UPDATE_API", env)) {
    blocked.add("update.run");
  }
  if (featureDisabled("OPENCLAW_DISABLE_CRON_API", env)) {
    blocked.add("cron.list");
    blocked.add("cron.status");
    blocked.add("cron.add");
    blocked.add("cron.update");
    blocked.add("cron.remove");
    blocked.add("cron.run");
    blocked.add("cron.runs");
  }
  if (featureDisabled("OPENCLAW_DISABLE_NODES_API", env)) {
    blocked.add("node.pair.request");
    blocked.add("node.pair.list");
    blocked.add("node.pair.approve");
    blocked.add("node.pair.reject");
    blocked.add("node.pair.verify");
    blocked.add("device.pair.list");
    blocked.add("device.pair.approve");
    blocked.add("device.pair.reject");
    blocked.add("device.token.rotate");
    blocked.add("device.token.revoke");
    blocked.add("node.rename");
    blocked.add("node.list");
    blocked.add("node.describe");
    blocked.add("node.invoke");
    blocked.add("node.invoke.result");
    blocked.add("node.event");
  }
  if (featureDisabled("OPENCLAW_DISABLE_EXEC_APPROVALS_API", env)) {
    blocked.add("exec.approvals.get");
    blocked.add("exec.approvals.set");
    blocked.add("exec.approvals.node.get");
    blocked.add("exec.approvals.node.set");
    blocked.add("exec.approval.request");
    blocked.add("exec.approval.resolve");
  }
  if (featureDisabled("OPENCLAW_DISABLE_VOICEWAKE_API", env)) {
    blocked.add("voicewake.get");
    blocked.add("voicewake.set");
  }
  if (featureDisabled("OPENCLAW_DISABLE_TALK_API", env)) {
    blocked.add("talk.mode");
  }
  if (featureDisabled("OPENCLAW_DISABLE_TTS_API", env)) {
    blocked.add("tts.status");
    blocked.add("tts.providers");
    blocked.add("tts.enable");
    blocked.add("tts.disable");
    blocked.add("tts.convert");
    blocked.add("tts.setProvider");
  }
  if (featureDisabled("OPENCLAW_DISABLE_DEVICE_API", env)) {
    blocked.add("device.pair.list");
    blocked.add("device.pair.approve");
    blocked.add("device.pair.reject");
    blocked.add("device.token.rotate");
    blocked.add("device.token.revoke");
  }

  return methods.filter((method) => !blocked.has(method));
}
