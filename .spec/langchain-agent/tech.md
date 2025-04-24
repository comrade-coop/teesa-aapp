# Technical Architecture: Teesa Word Game Langchain Agent Implementation

## 1. Technical Overview

### Architectural Approach

The refactoring will implement a Langchain agent architecture for the Teesa word game while maintaining the core game mechanics through specialized tools. The architecture will follow these key design patterns:

1. **Tool-based Architecture**: Core game functionality will be encapsulated in Langchain-compatible tools
2. **Agent-driven Conversation**: A Langchain agent will manage natural conversation flow and tool usage
3. **TEE Security Preservation**: Secret word security will be maintained within the Trusted Execution Environment
4. **State Management Integration**: Existing game state management will be preserved and integrated with the agent

### System Components

1. **Langchain Tools**:
   - Word Answer Tool: Evaluates yes/no questions about the secret word
   - Word Guess Tool: Verifies if a guess matches the secret word

2. **Langchain Agent**:
   - Conversation Manager: Handles natural dialogue with users
   - Tool Selector: Determines when to use specific tools
   - Memory Manager: Maintains conversation context

3. **Game State Integration**:
   - State Manager: Preserves existing game state functionality
   - History Tracker: Records conversation and game events
   - Winner Detection: Identifies correct guesses
   - NFT Generator: Triggers NFT creation for winners

4. **Security Layer**:
   - TEE Integration: Ensures secret word remains secure
   - Ollama Integration: Maintains secure inference for sensitive operations

### Data Models and Relationships

1. **Conversation Model**:
   - User messages
   - Agent responses
   - Tool invocations and results

2. **Game State Model**:
   - Secret word (secured in TEE)
   - Game history
   - Winner status
   - NFT generation status

3. **Tool Input/Output Models**:
   - Question string → Boolean (Word Answer Tool)
   - Guessed word string → Boolean (Word Guess Tool)

### Integration Points

1. **LLM Integration**:
   - Anthropic Claude for agent conversation
   - Ollama for secure word-related operations

2. **UI Integration**:
   - Maintain existing UI components
   - Update message handling for agent responses

3. **NFT Integration**:
   - Preserve existing NFT generation workflow
   - Trigger from agent on correct guess detection

## 2. Implementation Plan

### Step 1: Create Langchain Tools

1. **Word Answer Tool**
   - Extract core logic from existing `getAnswer()` method
   - Create Langchain-compatible tool wrapper
   - Ensure TEE security is maintained
   - Implement proper error handling

2. **Word Guess Tool**
   - Extract core logic from existing `checkGuess()` method
   - Create Langchain-compatible tool wrapper
   - Ensure TEE security is maintained
   - Implement proper error handling

### Step 2: Implement Langchain Agent

1. **Define Agent Prompt Template**
   - Create prompt that embodies Teesa's personality
   - Include instructions for tool usage
   - Define conversation steering logic

2. **Configure Agent Memory**
   - Set up conversation memory management
   - Integrate with existing game history

3. **Implement Agent Creation**
   - Configure agent with appropriate tools
   - Set up agent executor
   - Implement error handling and fallbacks

### Step 3: Integrate with Game State

1. **Adapt Existing Interfaces**
   - Modify `processUserMessage()` to use agent
   - Update `checkGuessMessage()` to work with agent
   - Preserve winner detection and NFT generation

2. **Update History Tracking**
   - Modify history structure to accommodate agent interactions
   - Ensure compatibility with existing UI components

3. **Implement Game Reset Functionality**
   - Ensure agent state resets properly with game state

### Step 4: Testing and Optimization

1. **Unit Testing**
   - Test individual tools
   - Test agent responses
   - Test game state integration

2. **Integration Testing**
   - Test end-to-end conversation flows
   - Test winner detection and NFT generation
   - Test game reset functionality

3. **Performance Optimization**
   - Optimize agent response time
   - Minimize latency in tool execution
   - Implement efficient context management

## 3. Code Structure Guidance

### Folder and File Organization

```
packages/teesa/app/_core/
├── langchain/
│   ├── tools/
│   │   ├── word-answer-tool.ts
│   │   ├── word-guess-tool.ts
│   │   └── index.ts
│   ├── agent/
│   │   ├── prompt-templates.ts
│   │   ├── agent-config.ts
│   │   └── index.ts
│   └── index.ts
├── word-game.ts (refactored)
├── game-state.ts (unchanged)
├── llm-client.ts (minor updates)
└── ...
```

### Key Classes and Methods

1. **Word Answer Tool**
```typescript
// word-answer-tool.ts
import { Tool } from "langchain/tools";
import { gameState } from "../../game-state";
import { sendMessageOllama } from "../../llm-client";

export class WordAnswerTool extends Tool {
  name = "word_answer";
  description = "Evaluates yes/no questions about the secret word";
  
  async _call(question: string): Promise<string> {
    // Implementation using existing getAnswer logic
    const secretWord = gameState.getSecretWord();
    const prompt = `
AGENT (thinks of a word and the thing it represents): ${secretWord}
USER (asks a yes/no question about it): ${question}
AGENT (answers with only "yes" or "no" based on common-sense logic): `;

    const response = await sendMessageOllama(prompt);
    const isYes = response.toLowerCase().replace(/[^a-z]/g, '') === 'yes';
    return isYes ? "true" : "false";
  }
}
```

2. **Word Guess Tool**
```typescript
// word-guess-tool.ts
import { Tool } from "langchain/tools";
import { gameState } from "../../game-state";
import { sendMessageOllama } from "../../llm-client";

export class WordGuessTool extends Tool {
  name = "word_guess";
  description = "Verifies if a guess matches the secret word";
  
  async _call(guess: string): Promise<string> {
    // Implementation using existing checkGuess logic
    const secretWord = gameState.getSecretWord();
    const prompt = `
Secret word: "${secretWord}".
User guess: "${guess}"

Check if the User guess matches the secret word exactly, or is a close synonym, plural form, or minor variation.
For example:
- "cat" matches "cats" or "kitty"
- "phone" matches "telephone" or "cellphone"
- "couch" matches "sofa"
But reject guesses that are:
- Different concepts entirely
- Too general or specific
- Only loosely related

Remember this is a guessing game and the guess should be accurate to be considered correct.
Respond with ONLY "correct" or "incorrect", nothing else.`;

    const response = await sendMessageOllama(prompt);
    const isCorrect = response.toLowerCase().replace(/[^a-z]/g, '') === 'correct';
    return isCorrect ? "true" : "false";
  }
}
```

3. **Agent Configuration**
```typescript
// agent-config.ts
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { WordAnswerTool } from "../tools/word-answer-tool";
import { WordGuessTool } from "../tools/word-guess-tool";
import { TEESA_AGENT_PROMPT } from "./prompt-templates";
import { BufferMemory } from "langchain/memory";

export function createTeesaAgent() {
  // Create tools
  const tools = [
    new WordAnswerTool(),
    new WordGuessTool()
  ];
  
  // Create LLM
  const llm = new ChatOpenAI({
    modelName: "claude-3-7-sonnet-20250219",
    temperature: 0.7
  });
  
  // Create memory
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input"
  });
  
  // Create agent
  const agent = createReactAgent({
    llm,
    tools,
    prompt: TEESA_AGENT_PROMPT
  });
  
  // Create agent executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    memory,
    verbose: true
  });
  
  return agentExecutor;
}
```

4. **Refactored Word Game**
```typescript
// word-game.ts (partial)
import { createTeesaAgent } from "./langchain";
import { HistoryEntry, gameState, AnswerResultEnum } from "./game-state";
import { MessageTypeEnum } from "./message-type-enum";
import { WON_GAME_MESSAGE } from "./game-const";

export class WordGame {
  private agent = createTeesaAgent();
  
  // ... existing code ...
  
  public async processUserMessage(userId: string, messageId: string, timestamp: number, input: string, inputType: MessageTypeEnum): Promise<string> {
    console.log(`Processing ${MessageTypeEnum[inputType]} from user: ${userId}, message ID: ${messageId}`);

    const trimmedInput = this.trimInput(input);
    let response: string = '';
    let answerResult: AnswerResultEnum = AnswerResultEnum.UNKNOWN;

    try {
      // Use the agent to process the message
      const agentResponse = await this.agent.call({
        input: trimmedInput,
        chat_history: await this.getHistoryForPrompt()
      });
      
      response = agentResponse.output;
      
      // Determine answer result based on tool usage
      if (agentResponse.intermediateSteps.some(step => step.action.tool === "word_answer")) {
        const answerStep = agentResponse.intermediateSteps.find(step => step.action.tool === "word_answer");
        answerResult = answerStep.observation === "true" ? AnswerResultEnum.YES : AnswerResultEnum.NO;
      }
      
      // Check if this was a correct guess
      if (agentResponse.intermediateSteps.some(step => step.action.tool === "word_guess" && step.observation === "true")) {
        console.log(`CORRECT GUESS! User ${userId} has won the game!`);
        response = WON_GAME_MESSAGE;
        answerResult = AnswerResultEnum.CORRECT;
      }
    } catch (error) {
      console.error("Error processing message with agent:", error);
      response = "I'm sorry, I'm having trouble processing your message. Please try again.";
    }

    const message: HistoryEntry = {
      id: messageId,
      userId: userId,
      timestamp: timestamp,
      messageType: inputType,
      userMessage: input,
      llmMessage: response,
      answerResult: answerResult
    };

    gameState.addToHistory(message);
    
    return response;
  }
  
  // ... other methods ...
}
```

### Reusable Components

1. **Prompt Templates**
```typescript
// prompt-templates.ts
import { PromptTemplate } from "langchain/prompts";

export const TEESA_AGENT_PROMPT = PromptTemplate.fromTemplate(`
You are Teesa, an AI agent who is the host of a word guessing game.
You are friendly, playful, and encouraging.
Your goal is to help users guess a secret word through yes/no questions.

You have access to the following tools:

word_answer: Use this tool when the user asks a yes/no question about the secret word.
word_guess: Use this tool when the user makes a direct guess about what the secret word is.

When users ask questions about the secret word, use the word_answer tool to get accurate information.
When users make a guess about the secret word, use the word_guess tool to check if they're correct.

If users are off-topic or not asking yes/no questions, gently steer them back to the game.
Be engaging and provide hints if users seem stuck, but don't reveal the secret word.

Chat History:
{chat_history}

User Input: {input}

Think through what kind of input this is and how to respond:
`);
```

2. **Tool Utilities**
```typescript
// tools/index.ts
export { WordAnswerTool } from './word-answer-tool';
export { WordGuessTool } from './word-guess-tool';

// Utility function to determine if a response indicates a correct guess
export function isCorrectGuess(agentResponse: any): boolean {
  return agentResponse.intermediateSteps.some(
    step => step.action.tool === "word_guess" && step.observation === "true"
  );
}

// Utility function to extract answer result from agent response
export function extractAnswerResult(agentResponse: any): AnswerResultEnum {
  if (isCorrectGuess(agentResponse)) {
    return AnswerResultEnum.CORRECT;
  }
  
  const answerStep = agentResponse.intermediateSteps.find(
    step => step.action.tool === "word_answer"
  );
  
  if (answerStep) {
    return answerStep.observation === "true" ? AnswerResultEnum.YES : AnswerResultEnum.NO;
  }
  
  return AnswerResultEnum.UNKNOWN;
}
```

## 4. Technical Requirements

### Performance Considerations

1. **Response Time Optimization**
   - Implement caching for common questions
   - Optimize prompt templates for efficiency
   - Consider parallel tool execution where possible

2. **Latency Minimization**
   - Keep prompt templates concise
   - Implement timeout handling for tools
   - Use streaming responses where appropriate

3. **Context Management**
   - Implement efficient memory management
   - Prune conversation history when needed
   - Use token counting to prevent context overflow

### Security Requirements

1. **TEE Security**
   - Maintain secret word within TEE boundaries
   - Ensure Ollama integration remains secure
   - Implement proper error handling to prevent leaks

2. **Tool Security**
   - Validate inputs to prevent injection attacks
   - Implement proper error handling
   - Ensure tools cannot be misused to extract secret word

3. **Agent Security**
   - Prevent prompt injection attacks
   - Implement proper validation of agent outputs
   - Ensure agent cannot be manipulated to reveal secret word

### Error Handling

1. **Tool Errors**
   - Implement proper error handling in tools
   - Provide meaningful error messages
   - Implement retry logic for transient errors

2. **Agent Errors**
   - Handle agent failures gracefully
   - Implement fallback responses
   - Log errors for debugging

3. **Integration Errors**
   - Handle state management errors
   - Implement proper error handling for NFT generation
   - Ensure game state remains consistent

### Testing Strategy

1. **Unit Tests**
   - Test individual tools
   - Test agent prompt templates
   - Test utility functions

2. **Integration Tests**
   - Test agent with tools
   - Test game state integration
   - Test conversation flows

3. **End-to-End Tests**
   - Test complete game scenarios
   - Test winner detection and NFT generation
   - Test error handling and recovery

## 5. Resources

### Documentation References

1. **Langchain Documentation**
   - [Langchain Agents](https://js.langchain.com/docs/modules/agents/)
   - [Langchain Tools](https://js.langchain.com/docs/modules/tools/)
   - [Langchain Memory](https://js.langchain.com/docs/modules/memory/)

2. **Ollama Documentation**
   - [Ollama API Reference](https://ollama.ai/library/llama3/api)
   - [Langchain Ollama Integration](https://js.langchain.com/docs/integrations/chat/ollama)

3. **TEE Security**
   - [aApp Toolkit Documentation](https://github.com/comrade-coop/aapp-toolkit)
   - [TEE Best Practices](https://github.com/comrade-coop/aapp-toolkit/blob/main/docs/APPMANIFEST.md)

### Similar Implementations

1. **Conversational Agents**
   - [LangChain Chat Agents](https://js.langchain.com/docs/use_cases/chatbots)
   - [Tool-using Agents](https://js.langchain.com/docs/modules/agents/agent_types/tool_calling_agent)

2. **Game Implementations**
   - [LangChain Game Examples](https://github.com/langchain-ai/langchain/tree/master/cookbook)
   - [AI Game Agents](https://js.langchain.com/docs/use_cases/autonomous_agents)

### Conceptual Diagrams

1. **Agent Architecture**
   ```
   User Input → Agent → Tool Selection → Tool Execution → Response Generation → User Output
                 ↑                                              |
                 |                                              ↓
                 ← ← ← ← ← ← ← ← ← Memory/History ← ← ← ← ← ← ← ←
   ```

2. **Tool Integration**
   ```
   Word Answer Tool → Ollama → TEE → Secret Word
   Word Guess Tool → Ollama → TEE → Secret Word
   ```

3. **Game State Flow**
   ```
   User Input → Agent → Tool Usage → Winner Detection → NFT Generation
                 ↑         |              |
                 |         ↓              ↓
                 ← ← Game State ← ← ← ← ← ←
   ```

## 6. Definition of Done

### Acceptance Criteria

1. **Functional Requirements**
   - Agent successfully processes user questions and guesses
   - Tools correctly evaluate questions and guesses
   - Game state is properly maintained
   - Winner detection and NFT generation work correctly

2. **Non-Functional Requirements**
   - Agent response time is under 2 seconds
   - Secret word remains secure within TEE
   - Conversation feels natural and engaging
   - Error handling is robust and user-friendly

### Testing Requirements

1. **Test Coverage**
   - 90%+ unit test coverage for tools
   - 80%+ integration test coverage for agent
   - End-to-end tests for all critical paths

2. **Performance Testing**
   - Response time benchmarks met
   - Memory usage within acceptable limits
   - Concurrent user handling tested

### Documentation Requirements

1. **Code Documentation**
   - All public methods and classes documented
   - Complex logic explained with comments
   - Tool interfaces clearly documented

2. **User Documentation**
   - Updated game instructions
   - Clear explanation of conversation capabilities
   - Troubleshooting guide for common issues

### Performance Benchmarks

1. **Response Time**
   - Average agent response time < 2 seconds
   - Tool execution time < 1 second
   - Winner detection and NFT generation < 5 seconds

2. **Resource Usage**
   - Memory usage < 500MB
   - CPU usage < 50% during peak
   - Network bandwidth < 1MB per interaction
