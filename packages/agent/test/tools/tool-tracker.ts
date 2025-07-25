let tools: Record<string, { count: number; callArgs: any[] }> = {};

export function resetToolTracker() {
  tools = {};
}

export function addToolCall(toolName: string, args ?: any) {
  if (!tools[toolName]) {
    tools[toolName] = { count: 0, callArgs: [] };
  }

  tools[toolName].count++;
  tools[toolName].callArgs.push(args || null);
}

export function getAllToolsCalls(): string[] {
  return Object.keys(tools);
}

export function getToolCallCount(toolName: string): number {
  return tools[toolName]?.count || 0;
}

export function getToolCallArgs(toolName: string, callIndex: number): any {
  return tools[toolName]?.callArgs[callIndex] || null;
}