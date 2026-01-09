import { getHUDStatePath } from "./plugin.js";
import * as fs from "fs";

interface HUDState {
  sessionId: string;
  messages: number;
  tools: Record<string, number>;
  lastActivity: string;
  model?: {
    provider: string;
    model: string;
  };
}

class HUDProcess {
  private statePath: string | null = null;
  private lastState: HUDState | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    getHUDStatePath().then((path) => {
      this.statePath = path;
    });
  }

  start() {
    console.log("[HUD Process] Starting...");
    this.render();
    this.watchState();
  }

  private watchState() {
    this.timer = setInterval(() => {
      this.render();
    }, 300);
  }

  private async render() {
    const state = await this.readState();
    if (!state) {
      this.renderEmpty();
      return;
    }

    if (JSON.stringify(state) === JSON.stringify(this.lastState)) {
      return;
    }

    this.lastState = state;
    this.clearScreen();
    this.renderState(state);
  }

  private async readState(): Promise<HUDState | null> {
    try {
      const statePath = await this.getStatePath();
      if (!fs.existsSync(statePath)) {
        return null;
      }

      const content = fs.readFileSync(statePath, "utf-8");
      return JSON.parse(content) as HUDState;
    } catch (error) {
      console.error("[HUD Process] Failed to read state:", error);
      return null;
    }
  }

  private async getStatePath(): Promise<string> {
    if (!this.statePath) {
      this.statePath = await getHUDStatePath();
    }
    return this.statePath;
  }

  private renderState(state: HUDState) {
    const timeSince = Math.floor(
      (Date.now() - new Date(state.lastActivity).getTime()) / 1000
    );
    const timeStr = timeSince < 60 ? `${timeSince}s` : `${Math.floor(timeSince / 60)}m`;

    const toolLines = Object.entries(state.tools)
      .map(([name, count]) => `  ${name}: ${count}`)
      .join("\n");

    const output = `
╔════════════════════════════════════════════════════════╗
║                    OpenCode HUD v0.1.0                    ║
╠════════════════════════════════════════════════════════╣
║  Session: ${state.sessionId.substring(0, 8)}${" ".repeat(40)}  ║
║  Model: ${state.model ? `${state.model.provider}/${state.model.model}` : "N/A"}${" ".repeat(38)}  ║
║  Messages: ${state.messages}${" ".repeat(45)}  ║
║  Activity: ${timeStr} ago${" ".repeat(39)}  ║
║${" ".repeat(58)}║
║  Tools:${" ".repeat(51)}  ║${toolLines ? toolLines.split("\n").map(line => `║${line}${" ".repeat(58 - line.length)}║`).join("\n") : `║  None${" ".repeat(51)}  ║`}
╚════════════════════════════════════════════════════════╝
`;
    process.stdout.write(output);
  }

  private renderEmpty() {
    const output = `
╔════════════════════════════════════════════════════════╗
║                    OpenCode HUD v0.1.0                    ║
╠════════════════════════════════════════════════════════╣
║  Waiting for OpenCode session...                            ║
║  Start OpenCode to see real-time status.                    ║
╚════════════════════════════════════════════════════════╝
`;
    process.stdout.write(output);
  }

  private clearScreen() {
    process.stdout.write("\x1b[2J\x1b[H");
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log("[HUD Process] Stopped");
  }
}

const hud = new HUDProcess();
hud.start();

process.on("SIGINT", () => {
  hud.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  hud.stop();
  process.exit(0);
});
