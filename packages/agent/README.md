# Agent

This package includes the agent code for the Teesa app. We are using [LangChain](https://www.langchain.com/) and [LangGraph](https://www.langchain.com/langgraph) for building the agent. We are using this project as a library in the [web-app](../web-app) and [twitter-client](../twitter-client) packages.


## Project Structure

- **src** - contains the agent code
  - **state** - contains the code for the agent state
  - **tools** - contains the tools for the agent
- **tests** - contains the tests for the agent


## Prerequisites

Ensure you have completed the **Development setup** - check the [README.md](../../README.md) in the root directory.


## Build the agent

To build the agent, run the following command from the **root directory**:
```bash
pnpm build
```

## Test the agent

To test the agent, run the following command from the **root directory**:
```bash
pnpm test
```