# Next.js Application

This project is the Next.js application for the Teesa game. We use `pnpm` for package management.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher recommended)
- **pnpm** (installation guide: [https://pnpm.io/installation](https://pnpm.io/installation))

## Installation

1. Install the dependencies:
   ```bash
   pnpm install
   ```

2. Set up the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with the correct values (see the Environment Variables section below).

## Environment Variables

You need to set the following environment variables:

### Anthropic API Key
- `ANTHROPIC_API_KEY`: Your API key for accessing the Anthropic LLMs

### Langsmith Configuration (used only in development)
- `LANGCHAIN_TRACING_V2`
- `LANGCHAIN_ENDPOINT`
- `LANGCHAIN_API_KEY`
- `LANGCHAIN_PROJECT`

### PrivyIO Configuration
- `NEXT_PUBLIC_PRIVYIO_APP_ID`
- `PRIVYIO_APP_SECRET`

### Game Contract
- `NEXT_PUBLIC_GAME_CONTRACT_ADDRESS`: This is automatically set by the contract deployment script. Refer to the README.md in the `/contracts` directory for more details.

## Running the Application

To start the development server, use the following command:
```bash
pnpm dev
```
This will start the app locally, and you can access it at http://localhost:3000.
