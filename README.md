# Teesa App

## 🛠️ Development Setup

### Prerequisites

Make sure you have the following installed:
- [Git](https://git-scm.com/) and [Git LFS](https://git-lfs.com/)

### Environment Setup

1. Install NVM
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```

2. Install Node   
   ```bash
   nvm install 23.3.0
   ```

3. Install Pnpm
   ```bash
   npm install -g pnpm
   ```

4. Install direnv (*optional if want to use `.envrc` to automatically set the correct node version when navigating to the repository directory*)
   - For MacOS
   ```bash
   brew install direnv
   ```
   - For Linux
   ```bash
   sudo apt-get install direnv
   ```

5. Clone the repository
   ```bash
   git clone https://github.com/comrade-coop/teesa-aapp.git
   ```

6. Navigate to the repository root directory
   ```bash
   cd teesa-aapp
   ```

7. Allow direnv (*if you installed direnv in 4.*)
   ```bash
   direnv allow
   ```

### Contracts Setup

See the README file in the [/contracts](/contracts/README.md) directory for the contract setup

### Next.js App Setup

See the README file in the [/teesa](/teesa/README.md) directory for Next.js app setup


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
      # localhost, sepolia, base
      --build-arg NETWORK=<network> \
      # Private key for the wallet
      --build-arg WALLET_PRIVATE_KEY=<wallet_private_key> \
      # RPC URL for the network
      --build-arg RPC_URL=<rpc_url> \
      # API key for the blockchain scanner (Etherscan or Basescan, depending on the network. We automatically use the correct API key based on the network.)
      --build-arg BLOCKCHAINSCAN_API_KEY=<blockchainscan_api_key> \
      # Address of the team multi-sig wallet to use for the contract deployment
      --build-arg TEAM_ADDRESS=<team_address> \
      # API key for the Anthropic API
      --build-arg ANTHROPIC_API_KEY=<anthropic_api_key> \
      # App ID of the PrivyIO
      --build-arg PRIVYIO_APP_ID=<privyio_app_id> \
      # App secret of the PrivyIO
      --build-arg PRIVYIO_APP_SECRET=<privyio_app_secret> \
      --pull \
      --rm \
      -f "deploy/Dockerfile" \
      -t teesa-app-deploy:latest \
      .
   ```

3. Run the production container:
   ```bash
   docker run -p 3000:3000 teesa-app-deploy:latest
   ```

### Accessing the Application

Once the container is started, you can access the application in your web browser at:
   ```
   http://localhost:3000
   ```


---


## 📜 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this project as per the license terms.
