# Development Environment Setup

This guide will help you set up the development environment using Docker.

## Prerequisites

- Docker installed on your system
- Git installed on your system

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

This will set up your development environment in a Docker container with all the necessary dependencies installed.