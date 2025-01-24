# Use the official Node.js image as the base image
FROM ubuntu:latest

# Set the working directory in the container
WORKDIR /projects

# Update apt-get and install all the required packages
RUN apt-get update && \
    apt-get install -y openssh-server && \
    apt-get install -y git && \
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash && apt-get install -y git-lfs && git lfs install && \
    apt-get install -y curl && \
    apt-get install -y build-essential python3 && \
    apt-get install -y python3-pip python3.12-venv direnv && \
    apt-get install -y docker.io && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# SSH setup
# ------------------------------------ START ------------------------------------

# Create the SSH directory and configure SSH server
RUN mkdir /var/run/sshd

# Set the root password for SSH login (optional, use with caution)
RUN echo 'root:p' | chpasswd

# Set default directory for SSH login
RUN echo "cd /teesa-aapp" >> /root/.bashrc

# Allow root login by updating the SSH config
RUN sed -i '/[[:space:]]*PermitRootLogin/s/.*/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i '/[[:space:]]*PasswordAuthentication/s/.*/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Prevent SSH session disconnection issues
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

# Expose the SSH port
EXPOSE 22

# ------------------------------------ END ------------------------------------


# Node setup
# ------------------------------------ START ------------------------------------

# Install NVM (Node Version Manager)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Install Node
RUN bash -c '. "/root/.nvm/nvm.sh" && nvm install 22'

# ------------------------------------ END ------------------------------------


# Next.js setup
# ------------------------------------ START ------------------------------------

# Install Pnpm globally
RUN bash -c '. "/root/.nvm//nvm.sh" && npm install -g pnpm'

# Expose the Next.js development server port
EXPOSE 3000

# ------------------------------------ END ------------------------------------


# Start the SSH service
RUN service ssh restart
