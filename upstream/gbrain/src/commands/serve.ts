import type { BrainEngine } from '../core/engine.ts';
import { startMcpServer } from '../mcp/server.ts';

export async function runServe(engine: BrainEngine) {
  console.error('Starting GBrain MCP server (stdio)...');
  await startMcpServer(engine);
}
