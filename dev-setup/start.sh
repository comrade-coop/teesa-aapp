#!/bin/bash

# Get the current directory path
current_directory=$(pwd)
# Define the volumes path (current_directory/volumes)
volumes_path="$current_directory/volumes"
# Get the repository root directory path
root_directory=$(dirname "$current_directory")

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
  -v "$root_directory:/teesa-aapp" \
  -v "$volumes_path/vscode:/root/.vscode-server" \
  -v "$volumes_path/cursor:/root/.cursor-server" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e GIT_CONFIG_NAME="$(git config --get user.name)" \
  -e GIT_CONFIG_EMAIL="$(git config --get user.email)" \
  teesa-aapp \
  sh -c 'git config --global user.name "${GIT_CONFIG_NAME}" && git config --global user.email "${GIT_CONFIG_EMAIL}" && /usr/sbin/sshd -D'