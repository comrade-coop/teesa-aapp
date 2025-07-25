# Web App

This project is the Next.js application for the Teesa app.


## Prerequisites

- Ensure you have completed the **Development setup** - check the [README.md](../../README.md) in the root directory.
- Ensure you have deployed the NFT contract - check the [README.md](../nft/README.md) in the `packages/nft` directory.
- Ensure you have build the entire project - check the [README.md](../../README.md) in the root directory.


## Project Structure

- **app** - contains the pages, API endpoints and the game core logic
  - **game** - contains the game pages
  - **wallet** - contains the page for interacting with the Teesa wallet
- **components** - contains the reusable components
- **lib** - contains the utility functions
- **public** - contains the static assets
- **scripts** - contains the script for copy the .env file to the teesa directory


## Setup

Set permissions for the scripts
```bash
chmod +x scripts/copy-env.sh
```

## Start the Application

To start the ollama model and the development server, run the following command from the **root directory**:
```bash
pnpm web
```
This will start the ollama model and the app locally, and you can access the app at http://localhost:3000.

*NOTE: As this is a pnpm monorepo, we are using only one `.env` file for all the packages. This file is located in the root directory. To have acess to the environment variables when building and starting the NextJS app, we make a temporary copy of the `.env` file in the `packages/web-app` directory when some of the following commands are started and remove it after the commands are finished: `pnpm build`, `pnpm start`, `pnpm dev`.*
