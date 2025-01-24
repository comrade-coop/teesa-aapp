# Teesa App

## 🛠️ Development Setup

To start the app in development mode, please follow the instruction in:
1. [dev-setup/README.md](dev-setup/README.md) - To setup your development environment
2. [contracts/README.md](contracts/README.md) - To deploy the contracts
3. [teesa/README.md](teesa/README.md) - To run the Next.js app


---


## 🚀 Production Setup

Follow these instructions to set up, configure, and run the Teesa application in production mode on your local machine or server.

### Prerequisites

Make sure you have the following installed:
- [Docker](https://www.docker.com/) (latest version recommended)
- [Git](https://git-scm.com/) and [Git LFS](https://git-lfs.com/)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/comrade-coop/teesa-aapp.git
   ```

2. Navigate to the root directory: 
   ```bash
   cd teesa-aapp
   ```

3. Build the production Docker image:
   ```bash
   docker build \
      --build-arg NETWORK=<network> \ # localhost, sepolia, base
      --build-arg WALLET_PRIVATE_KEY=<wallet_private_key> \ # private key for the wallet
      --build-arg RPC_URL=<rpc_url> \ # RPC URL for the network
      --build-arg BLOCKCHAINSCAN_API_KEY=<blockchainscan_api_key> \ # API key for the blockchain scanner (Etherscan or Basescan, depending on the network. We automatically use the correct API key based on the network.)
      --build-arg TEAM_ADDRESS=<team_address> \ # The address of the team multi-sig wallet
      --build-arg ANTHROPIC_API_KEY=<anthropic_api_key> \ # API key for the Anthropic API
      --build-arg PRIVYIO_APP_ID=<privyio_app_id> \ # App ID of the PrivyIO
      --build-arg PRIVYIO_APP_SECRET=<privyio_app_secret> \ # App secret of the PrivyIO
      --pull \
      --rm \
      -f "deploy/Dockerfile" \
      -t teesa-app-deploy:latest \
      .
   ```

3. Run the production container:
   ```bash
   docker run \
      -p 3000:3000 \
      -v "$(pwd)/volumes/ollama:/root/.ollama" \ # Optional: If you want to persist the ollama models
      teesa-app-deploy:latest
   ```

### Accessing the Application

Once the container is started, you can access the application in your web browser at:
   ```
   http://localhost:3000
   ```


---


## 📜 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this project as per the license terms.
