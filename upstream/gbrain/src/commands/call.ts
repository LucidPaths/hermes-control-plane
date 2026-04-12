import type { BrainEngine } from '../core/engine.ts';
import { handleToolCall } from '../mcp/server.ts';

export async function runCall(engine: BrainEngine, args: string[]) {
  const tool = args[0];
  const jsonStr = args[1];

  if (!tool) {
    console.error('Usage: gbrain call <tool> \'<json>\'');
    process.exit(1);
  }

  const params = jsonStr ? JSON.parse(jsonStr) : {};
  const result = await handleToolCall(engine, tool, params);
  console.log(JSON.stringify(result, null, 2));
}
