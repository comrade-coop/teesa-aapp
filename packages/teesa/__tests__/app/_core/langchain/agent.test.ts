import { createTeesaAgent } from '../../../../app/_core/langchain/agent';


describe('Langchain Agent', () => {
  it('should create a Teesa agent with the correct configuration', async () => {
    const agent = await createTeesaAgent();

    // Check that the agent was created with the correct tools
    expect(agent.tools).toHaveLength(2);
    expect(agent.tools[0].name).toBe('word_answer');
    expect(agent.tools[1].name).toBe('word_guess');

    // Check that the agent has memory
    expect(agent.memory).toBeDefined();
  });

  it('should be able to invoke the agent', async () => {
    const agent = await createTeesaAgent();

    // Mock the invoke method
    const mockInvoke = jest.fn().mockResolvedValue({
      output: 'Mock agent response',
      intermediateSteps: []
    });
    agent.invoke = mockInvoke;

    const response = await agent.invoke({
      input: 'is it alive?',
      chat_history: []
    });

    expect(response.output).toBe('Mock agent response');
    expect(mockInvoke).toHaveBeenCalledWith({
      input: 'is it alive?',
      chat_history: []
    });
  });
});
