import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Determine the absolute path of this project
const projectRoot = process.cwd();
const mcpScriptPath = join(projectRoot, "dist/src/mcp/index.js");

console.log("=== dev-tracker MCP Auto-Configuration ===");
console.log(`Project root: ${projectRoot}`);
console.log(`MCP script path: ${mcpScriptPath}`);

const home = homedir();

// 1. Configure Hermes (~/.hermes/config.yaml)
const hermesConfigPath = join(home, ".hermes", "config.yaml");
if (existsSync(hermesConfigPath)) {
  console.log(`\nConfiguring Hermes at: ${hermesConfigPath}`);
  try {
    let content = readFileSync(hermesConfigPath, "utf8");
    const mcpBlock = `  dev-tracker:
    command: node
    args:
      - ${mcpScriptPath}
    env:
      DEV_TRACKER_API_URL: http://localhost:6789/api
    enabled: true`;

    if (content.includes("dev-tracker:") && content.includes("DEV_TRACKER_API_URL")) {
      console.log("Updating existing dev-tracker MCP entry in Hermes config...");
      const regex = / {2}dev-tracker:\s+command:\s*node\s+args:(\s+- [^\n]+)+(\s+env:(\s+[^\n]+)+)?(\s+enabled:\s*(true|false))?/g;
      if (regex.test(content)) {
        content = content.replace(regex, mcpBlock);
      } else {
        const startIdx = content.indexOf("  dev-tracker:");
        const nextServiceIdx = content.indexOf("\n  ", startIdx + 14);
        if (startIdx !== -1 && nextServiceIdx !== -1) {
          content = content.slice(0, startIdx) + mcpBlock + content.slice(nextServiceIdx);
        } else if (startIdx !== -1) {
          content = content.slice(0, startIdx) + mcpBlock + "\n";
        }
      }
    } else {
      console.log("Adding dev-tracker MCP entry to Hermes config...");
      const mcpServersIdx = content.indexOf("mcp_servers:");
      if (mcpServersIdx !== -1) {
        const nextLineIdx = content.indexOf("\n", mcpServersIdx);
        content = content.slice(0, nextLineIdx + 1) + mcpBlock + "\n" + content.slice(nextLineIdx + 1);
      } else {
        content += `\nmcp_servers:\n${mcpBlock}\n`;
      }
    }

    writeFileSync(hermesConfigPath, content, "utf8");
    console.log("✓ Hermes MCP configuration updated successfully.");
  } catch (err: any) {
    console.error(`✗ Failed to update Hermes config: ${err.message}`);
  }
} else {
  console.log("\nHermes config not found.");
}

// 2. Configure OpenCode (~/.config/opencode/opencode.json)
const opencodePath = join(home, ".config", "opencode", "opencode.json");
if (existsSync(opencodePath)) {
  console.log(`\nConfiguring OpenCode at: ${opencodePath}`);
  try {
    const raw = readFileSync(opencodePath, "utf8");
    const config = JSON.parse(raw || "{}");

    if (!config.mcp) {
      config.mcp = {};
    }

    config.mcp["dev-tracker"] = {
      command: ["node", mcpScriptPath],
      env: {
        DEV_TRACKER_API_URL: "http://localhost:6789/api"
      },
      type: "local"
    };

    writeFileSync(opencodePath, JSON.stringify(config, null, 2), "utf8");
    console.log("✓ OpenCode MCP configuration updated successfully.");
  } catch (err: any) {
    console.error(`✗ Failed to update OpenCode config: ${err.message}`);
  }
} else {
  console.log("\nOpenCode config not found.");
}

console.log("\n=== Auto-Configuration Complete! ===");
console.log("Make sure to build the project ('pnpm build') before running the MCP server.");