# Teesa App

## Getting Started

Follow these instructions to set up, configure, and run the Teesa application on your local machine or server.

### Prerequisites

Make sure you have the following installed:

- [Docker](https://www.docker.com/) (latest version recommended)
- [Git](https://git-scm.com/)
- A text editor (e.g., VSCode, Nano, Vim) for editing `.env` files

---

### Installation

1. Clone the repository and navigate into the `teesa` directory:

   ```bash
   git clone https://github.com/your-repo-name/teesa.git
   cd teesa
   ```

2. Copy the environment example file to `.env`:

   ```bash
   cp .env.example .env
   ```

3. Open the `.env` file and configure the required keys with your values:

   ```bash
   nano .env
   ```
   (Replace `nano` with your preferred text editor.)

### Development Mode

To run the application in development mode with hot reloading:

1. Build the development Docker image:

   ```bash
   docker build --target dev --pull --rm -f "Dockerfile" -t teesa-app-dev:latest "."
   ```

2. Run the development container with volume mounting for hot reloading:

   ```bash
   docker run -p 3000:3000 -v ./teesa:/app -v /app/node_modules teesa-app-dev:latest
   ```

The application will be available at `http://localhost:3000` with hot reloading enabled.

### Production Mode

1. Build the production Docker image:

   ```bash
   docker build --pull --rm -f "Dockerfile" -t teesa-app-deploy:latest "."
   ```

2. Run the production container:

   ```bash
   docker run -p 3000:3000 teesa-app-deploy:latest
   ```

---

### Accessing the Application

Once the container is running, you can access the application in your web browser at:

```
http://localhost:3000
```

---

### License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this project as per the license terms.

---