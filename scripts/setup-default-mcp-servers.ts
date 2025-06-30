import { pgDb } from "lib/db/pg/db.pg";
import { McpServerSchema } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import type { MCPServerConfig } from "app-types/mcp";

import { IS_MCP_SERVER_REMOTE_ONLY } from "lib/const";

const DEFAULT_MCP_SERVERS = [
  {
    name: "cmp-mcp-server",
    config: {
      url: "https://cmp-mcp-server.zlinoliver.workers.dev/sse",
    } as MCPServerConfig,
  },
  {
    name: "acc-mcp-server",
    config: {
      url: "https://acc-mcp-server.zlinoliver.workers.dev/sse",
    } as MCPServerConfig,
  },
  {
    name: "swagger-mcp-server",
    config: {
      url: "https://swagger-mcp-server.zlinoliver.workers.dev/sse",
    } as MCPServerConfig,
  },
  // Add DuckDuckGo search server only for local development
  ...(IS_MCP_SERVER_REMOTE_ONLY
    ? []
    : [
        {
          name: "duckduckgo-search",
          config: {
            command: "uvx",
            args: ["duckduckgo-mcp-server"],
          } as MCPServerConfig,
        },
      ]),
];

async function setupDefaultMCPServers() {
  console.log("Setting up default MCP servers...");

  for (const server of DEFAULT_MCP_SERVERS) {
    try {
      // Check if server already exists
      const existing = await pgDb
        .select()
        .from(McpServerSchema)
        .where(eq(McpServerSchema.name, server.name))
        .limit(1);

      if (existing.length === 0) {
        // Insert new server
        await pgDb.insert(McpServerSchema).values({
          name: server.name,
          config: server.config,
          enabled: true,
        });
        console.log(`✅ Added MCP server: ${server.name}`);
      } else {
        console.log(`⏭️  MCP server already exists: ${server.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to add MCP server ${server.name}:`, error);
    }
  }

  console.log("Default MCP servers setup completed.");
}

export { setupDefaultMCPServers };
