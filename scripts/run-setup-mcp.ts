#!/usr/bin/env tsx
import "load-env";
import { setupDefaultMCPServers } from "./setup-default-mcp-servers";

setupDefaultMCPServers().catch(console.error);