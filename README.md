# Start the project in Docker

`docker build --pull --rm -f "Dockerfile" -t teesa-aapp-deploy:latest "."`

`docker run -p 3000:3000 teesa-aapp-deploy:latest`