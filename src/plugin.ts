import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin/tool";

export interface HUDState {
  sessionId: string;
  messages: number;
  tools: Map<string, number>;
  lastActivity: Date;
  model?: {
    provider: string;
    model: string;
  };
}

let globalState: HUDState | null = null;

export const HUDPlugin = async (ctx: any): Promise<any> => {
  console.log("[HUD Plugin] Initializing...");

  globalState = {
    sessionId: "",
    messages: 0,
    tools: new Map(),
    lastActivity: new Date(),
    model: undefined,
  };

  return {
    "chat.message": async (input: any) => {
      if (globalState && input.sessionID !== globalState.sessionId) {
        globalState.sessionId = input.sessionID;
        globalState.messages = 0;
        globalState.tools.clear();
      }

      if (globalState) {
        globalState.messages++;
        globalState.lastActivity = new Date();
        if (input.model) {
          globalState.model = {
            provider: input.model.providerID,
            model: input.model.modelID,
          };
        }
        notifyStateChange();
      }
    },

    "tool.execute.before": async (input: any) => {
      if (globalState) {
        globalState.lastActivity = new Date();
        notifyStateChange();
      }
    },

    "tool.execute.after": async (input: any, output: any) => {
      if (globalState) {
        const count = globalState.tools.get(input.tool) || 0;
        globalState.tools.set(input.tool, count + 1);
        globalState.lastActivity = new Date();
        notifyStateChange();
      }
    },

    tool: {
      "hud:status": tool({
        description: "显示当前 HUD 状态",
        args: {},
        async execute(args: any, context: any) {
          return getStatusReport();
        },
      }),
    },
  };

  function notifyStateChange() {
    writeStateFile();
  }

  function writeStateFile() {
    if (!globalState) return;

    const statePath = getHUDStatePath();
    const stateData = {
      sessionId: globalState.sessionId,
      messages: globalState.messages,
      tools: Object.fromEntries(globalState.tools),
      lastActivity: globalState.lastActivity.toISOString(),
      model: globalState.model,
    };

    try {
      const fs = require("fs");
      fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
    } catch (error) {
      console.error("[HUD Plugin] Failed to write state:", error);
    }
  }
};

export function getHUDStatePath(): string {
  const os = require("os");
  const path = require("path");
  const tmpdir = os.tmpdir();
  return path.join(tmpdir, "opencode-hud-state.json");
}

function getStatusReport(): string {
  if (!globalState) {
    return "HUD not initialized";
  }

  const tools = Array.from(globalState.tools.entries())
    .map(([name, count]) => `${name}: ${count}`)
    .join(", ");

  const timeSince = Math.floor((Date.now() - globalState.lastActivity.getTime()) / 1000);
  const timeStr = timeSince < 60 ? `${timeSince}s` : `${Math.floor(timeSince / 60)}m`;

  return `
[OpenCode HUD]
Session: ${globalState.sessionId || "N/A"}
Messages: ${globalState.messages}
Model: ${globalState.model ? `${globalState.model.provider}/${globalState.model.model}` : "N/A"}
Tools: ${tools || "None"}
Last activity: ${timeSince < 60 ? `${timeSince}s ago` : `${Math.floor(timeSince / 60)}m ago`}
`;
}
