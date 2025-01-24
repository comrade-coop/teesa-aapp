#!/bin/bash

# Determine if we're running from repo root or dev-setup directory
current_directory=$(dirname "$0")
if [ "$current_directory" = "." ]; then
    # Script is being run from dev-setup directory
    script_directory=$(pwd)
    root_directory=$(dirname "$script_directory")
else
    # Script is being run from repository root
    script_directory="$(pwd)/dev-setup"
    root_directory=$(pwd)
fi

# Define the volumes path (script_directory/volumes)
volumes_path="$script_directory/volumes"

ssh_port=22909

# Clear current SSH hosts entry. Use this when reinstalling the container
if [ "$1" == "clear" ]; then
  echo "Clearing the SSH hosts entry for localhost:$ssh_port"
  ssh-keygen -R "[localhost]:$ssh_port"
fi

# Start the Docker container
docker run -d \
  -p "$ssh_port:22" \
  -p "3000:3000" \
  -p "11434:11434" \
  -v "$root_directory:/teesa-aapp" \
  -v "$volumes_path/vscode:/root/.vscode-server" \
  -v "$volumes_path/cursor:/root/.cursor-server" \
  -v "$volumes_path/ollama:/root/.ollama" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e GIT_CONFIG_NAME="$(git config --get user.name)" \
  -e GIT_CONFIG_EMAIL="$(git config --get user.email)" \
  teesa-aapp \
  sh -c "git config --global user.name '${GIT_CONFIG_NAME}' && git config --global user.email '${GIT_CONFIG_EMAIL}' && tail -f /dev/null"