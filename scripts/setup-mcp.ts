import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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
  console.log(`\nDetecting Hermes config at: ${hermesConfigPath}`);
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
      // Already has dev-tracker configured, let's replace its block
      console.log("Updating existing dev-tracker MCP entry in Hermes config...");
      const regex = / {2}dev-tracker:\s+command:\s*node\s+args:(\s+- [^\n]+)+(\s+env:(\s+[^\n]+)+)?(\s+enabled:\s*(true|false))?/g;
      if (regex.test(content)) {
        content = content.replace(regex, mcpBlock);
      } else {
        // Fallback replacement if formatting varies
        const startIdx = content.indexOf("  dev-tracker:");
        const nextServiceIdx = content.indexOf("\n  ", startIdx + 14);
        if (startIdx !== -1 && nextServiceIdx !== -1) {
          content = content.slice(0, startIdx) + mcpBlock + content.slice(nextServiceIdx);
        } else if (startIdx !== -1) {
          content = content.slice(0, startIdx) + mcpBlock + "\n";
        }
      }
    } else {
      // Add new dev-tracker block
      console.log("Adding dev-tracker MCP entry to Hermes config...");
      const mcpServersIdx = content.indexOf("mcp_servers:");
      if (mcpServersIdx !== -1) {
        // Inject under mcp_servers:
        const nextLineIdx = content.indexOf("\n", mcpServersIdx);
        content = content.slice(0, nextLineIdx + 1) + mcpBlock + "\n" + content.slice(nextLineIdx + 1);
      } else {
        // Append mcp_servers to end
        content += `\nmcp_servers:\n${mcpBlock}\n`;
      }
    }

    writeFileSync(hermesConfigPath, content, "utf8");
    console.log("✓ Hermes MCP configuration updated successfully.");
  } catch (err: any) {
    console.error(`✗ Failed to update Hermes config: ${err.message}`);
  }
} else {
  console.log("\nHermes config not found (skipping Hermes setup).");
}

// 2. Configure Claude Desktop
const claudePaths = [
  // Linux
  join(home, ".config", "Claude", "claude_desktop_config.json"),
  join(home, ".config", "Claude Desktop", "claude_desktop_config.json"),
  // macOS fallback
  join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
];

let claudeUpdated = false;
for (const path of claudePaths) {
  if (existsSync(path) || path.includes(".config/Claude/")) { // Create directory if needed for default Linux path
    console.log(`\nConfiguring Claude Desktop at: ${path}`);
    try {
      const dir = join(path, "..");
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      let config: any = {};
      if (existsSync(path)) {
        const raw = readFileSync(path, "utf8");
        config = JSON.parse(raw || "{}");
      }

      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers["dev-tracker"] = {
        command: "node",
        args: [mcpScriptPath],
        env: {
          DEV_TRACKER_API_URL: "http://localhost:6789/api"
        }
      };

      writeFileSync(path, JSON.stringify(config, null, 2), "utf8");
      console.log("✓ Claude Desktop MCP configuration updated successfully.");
      claudeUpdated = true;
    } catch (err: any) {
      console.error(`✗ Failed to update Claude Desktop config: ${err.message}`);
    }
  }
}
if (!claudeUpdated) {
  console.log("\nClaude Desktop directory not found (skipping Claude setup).");
}

// 3. Configure Cursor
const cursorPaths = [
  // Linux
  join(home, ".config", "Cursor", "User", "globalStorage", "moosemer.cursor-mcp", "mcpjson.json"),
  // macOS fallback
  join(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "moosemer.cursor-mcp", "mcpjson.json")
];

let cursorUpdated = false;
for (const path of cursorPaths) {
  if (existsSync(path) || path.includes(".config/Cursor/")) {
    console.log(`\nConfiguring Cursor at: ${path}`);
    try {
      const dir = join(path, "..");
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      let config: any = {};
      if (existsSync(path)) {
        const raw = readFileSync(path, "utf8");
        config = JSON.parse(raw || "{}");
      }

      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers["dev-tracker"] = {
        command: "node",
        args: [mcpScriptPath],
        env: {
          DEV_TRACKER_API_URL: "http://localhost:6789/api"
        }
      };

      writeFileSync(path, JSON.stringify(config, null, 2), "utf8");
      console.log("✓ Cursor MCP configuration updated successfully.");
      cursorUpdated = true;
    } catch (err: any) {
      console.error(`✗ Failed to update Cursor config: ${err.message}`);
    }
  }
}
if (!cursorUpdated) {
  console.log("\nCursor MCP storage directory not found (skipping Cursor setup).");
}

// 4. Configure Windsurf
const windsurfPaths = [
  // Linux
  join(home, ".codeium", "windsurf", "mcp_config.json"),
  // macOS fallback
  join(home, "Library", "Application Support", "Codeium", "Windsurf", "mcp_config.json")
];

let windsurfUpdated = false;
for (const path of windsurfPaths) {
  if (existsSync(path) || path.includes(".codeium/windsurf/")) {
    console.log(`\nConfiguring Windsurf at: ${path}`);
    try {
      const dir = join(path, "..");
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      let config: any = {};
      if (existsSync(path)) {
        const raw = readFileSync(path, "utf8");
        config = JSON.parse(raw || "{}");
      }

      if (!config.mcpServers) config.mcpServers = {};
      config.mcpServers["dev-tracker"] = {
        command: "node",
        args: [mcpScriptPath],
        env: {
          DEV_TRACKER_API_URL: "http://localhost:6789/api"
        }
      };

      writeFileSync(path, JSON.stringify(config, null, 2), "utf8");
      console.log("✓ Windsurf MCP configuration updated successfully.");
      windsurfUpdated = true;
    } catch (err: any) {
      console.error(`✗ Failed to update Windsurf config: ${err.message}`);
    }
  }
}
if (!windsurfUpdated) {
  console.log("\nWindsurf directory not found (skipping Windsurf setup).");
}

console.log("\n=== Auto-Configuration Complete! ===");
console.log("Make sure to build the project ('pnpm build') before running the MCP server.");
console.log("To manually configure in Cursor or other agents:");
console.log("  - Type: command");
console.log(`  - Command: node "${mcpScriptPath}"`);
console.log("  - Environment Variable: DEV_TRACKER_API_URL=http://localhost:6789/api");