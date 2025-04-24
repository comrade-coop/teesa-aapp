# Teesa Dev Container

This directory contains the configuration for the Visual Studio Code Dev Container for the Teesa project.

## Features

- Ubuntu-based development environment
- Node.js v22 (as specified in .nvmrc)
- pnpm v10.7.0 package manager
- Ollama for LLM inference
- Git and Git LFS
- Docker-in-Docker support
- Persistent volumes for node_modules and Ollama models

## Usage

1. Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension in VS Code.
2. Open the project in VS Code.
3. Click on the green button in the bottom-left corner of VS Code and select "Reopen in Container".
4. Wait for the container to build and start.
5. Start developing!

## Environment Setup

The dev container automatically:
- Installs all dependencies with `pnpm install`
- Starts the Ollama service
- Configures VS Code with recommended extensions and settings

## Running the Application

Once the dev container is running, you can use the following commands:

```bash
# Start the development server
pnpm dev

# Build the application
pnpm build

# Start the production server
pnpm teesa
```

## Ports

The following ports are forwarded from the container to the host:
- 3000: Next.js development server
- 11434: Ollama API

## Volumes

The following volumes are mounted for persistence:
- node_modules: For faster subsequent builds
- .ollama: For persisting Ollama models
- Docker socket: For Docker-in-Docker support
