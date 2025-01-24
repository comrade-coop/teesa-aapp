#!/bin/bash

# Start SSH daemon
service ssh start

# Start Ollama
ollama serve &

# Keep the container running and execute any additional commands
exec "$@" 