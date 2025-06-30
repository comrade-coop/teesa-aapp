FROM ubuntu:latest

# Avoid prompts during package installation
ARG DEBIAN_FRONTEND=noninteractive

# Update apt-get and install all the required packages
RUN apt-get update && \
    apt-get install -y zsh git curl wget build-essential python3 python3-pip \
    python3-venv direnv docker.io && \
    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash && \
    apt-get install -y git-lfs && \
    git lfs install && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install oh-my-zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# Set oh-my-zsh theme to agnoster
# RUN sed -i 's/ZSH_THEME="robbyrussell"/ZSH_THEME="agnoster"/g' /root/.zshrc
RUN wget https://raw.githubusercontent.com/moarram/headline/main/headline.zsh-theme && \
    sed -i "s/'echo \$USER'/'whoami'/g" headline.zsh-theme && \
    sed -i "s/'basename \"\$VIRTUAL_ENV\"'/'basename \"\$CONDA_DEFAULT_ENV\"'/g" headline.zsh-theme && \
    mv headline.zsh-theme /root/.oh-my-zsh/themes/headline.zsh-theme && \
    echo 'source /root/.oh-my-zsh/themes/headline.zsh-theme' >> /root/.zshrc

# Install NVM (Node Version Manager)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Set up NVM environment
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh"

# Install Node.js version specified in .nvmrc (Node 22)
RUN bash -c '. "$NVM_DIR/nvm.sh" && nvm install 22 && nvm use 22 && nvm alias default 22'

# Install Pnpm globally
RUN bash -c '. "$NVM_DIR/nvm.sh" && npm install -g pnpm@10.7.0'

# Download and install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Expose ports (Next.js and Ollama)
EXPOSE 3000 11434

# Set the working directory
WORKDIR /workspaces/teesa-aapp

# Add NVM and Node.js to PATH
ENV PATH="${NVM_DIR}/versions/node/22/bin:${PATH}"

# Setup bash to automatically source NVM
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc && \
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
