# Development Environment Setup

This guide will help you set up the development environment.

---


# 🐳 Docker Setup

Please follow the instruction is this section to setup your development environment using Docker.

## Prerequisites

- [Docker](https://www.docker.com) installed on your system
- [Git](https://git-scm.com/) and [Git LFS](https://git-lfs.com/)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/comrade-coop/teesa-aapp.git
```

2. Navigate to the repository root directory:
```bash
cd teesa-aapp
```

3. Build the Docker container:
```bash
docker build --pull --rm -f "dev-setup/Dockerfile" -t teesa-aapp:latest .
```

4. Start the container:
```bash
chmod +x dev-setup/start.sh
./dev-setup/start.sh clear
```

The `dev-setup/start.sh` script accepts the following parameters:
- Use `./dev-setup/start.sh clear` to clean the SSH hosts entry. This should only be used after rebuilding the container.
- Use `./dev-setup/start.sh` without parameters for regular container startup.

5. Connect to the container:
```bash
ssh root@localhost -p 22909
```

Connection details:
- Host: **localhost**
- Port: **22909**
- Username: **root**
- Password: **p**

*Note*: We have configured the container with persistent volumes for VSCode and Cursor extensions and settings, so you have a consistent development environment across container restarts.

*Note*: We have configured the container with Docker socket volume, so you can access the Docker daemon on the host machine from the container.

*Note*: We have configured the container with persistent volume for Ollama, so we keep the pulled models when restarting the container.

This will set up your development environment in a Docker container with all the necessary dependencies installed.


---


# 🛠️ Local Setup

Please follow the instruction in this section to setup your development environment without using Docker.

## Prerequisites

Make sure you have the following installed:
- [Git](https://git-scm.com/) and [Git LFS](https://git-lfs.com/)
- [Ollama](https://ollama.com)
- For Windows users, we recommend using [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)

## Environment Setup

1. Install NVM
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```

2. Install direnv (*optional if want to use `.envrc` to automatically set the correct node version when navigating to the repository directory*)
   - For MacOS
   ```bash
   brew install direnv
   ```
   - For Linux/WSL2 on Windows
   ```bash
   sudo apt-get install direnv
   ```

3. Clone the repository
   ```bash
   git clone https://github.com/comrade-coop/teesa-aapp.git
   ```

4. Navigate to the repository root directory
   ```bash
   cd teesa-aapp
   ```

5. Install Node based on the `.nvmrc` file
   ```bash
   nvm install
   ```

6. Install Pnpm
   ```bash
   npm install -g pnpm
   ```

7. Allow direnv (*if you installed direnv in 2.*)
   ```bash
   direnv allow
   ```