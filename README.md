# Teesa App

## Getting Started

Follow these instructions to set up, configure, and run the Teesa application in production mode on your local machine or server.

### For development mode:
0. See the README file in the [/dev-setup](/dev-setup/README.md) directory for the Docker development environment setup
1. See the README file in the [/contracts](/contracts/README.md) directory for the contract setup
2. See the README file in the [/teesa](/teesa/README.md) directory for Next.js app setup

### Prerequisites

Make sure you have the following installed:
- [Docker](https://www.docker.com/) (latest version recommended)
- [Git](https://git-scm.com/) and [Git LFS](https://git-lfs.com/)

---

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
   docker build --pull --rm -f "Dockerfile" -t teesa-app-deploy:latest "."
   ```

3. Run the production container:

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
