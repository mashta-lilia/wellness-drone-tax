# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# 🚀 DevOps: Infrastructure and CI/CD

The project features complete containerization of its services and an automated pipeline for code verification (CI/CD).

## 🏗 What was implemented

### 1. Container Orchestration (Docker Compose)
A `docker-compose.yml` configuration file was created to deploy the project in an isolated environment. 
* **Services**: The infrastructure is divided into two independent containers: `api` (backend) and `frontend`.
* **Fault Tolerance**: Both services are configured with a `restart: always` policy, which guarantees their automatic restart in case of unexpected crashes or system reboots.

### 2. Continuous Integration (GitHub Actions)
An automated pipeline (`.github/workflows/ci.yml`) is set up to trigger on every `push` and `pull_request` event to the `main` branch.

The pipeline includes the following verification stages:
* **Frontend**: Sets up a Node.js (version 24) environment, performs a clean installation of dependencies using the `npm ci` command, runs code quality checks (`npm run lint`), and executes a test build (`npm run build`).
* **Backend**: Sets up a Python (version 3.12) environment, updates the `pip` package manager, and installs all dependencies from `requirements.txt`. A step for running `pytest` tests is also prepared.

---

## 🛠 How to run the project locally

To run the project, you must have **Docker** and **Docker Compose** installed on your machine.

### Step 1. Setup Environment Variables
To successfully start the containers, you need to define environment variables. Create a `.env` file in the root directory of the project and specify the following parameters:
* `DATABASE_URL` — the database connection string (used by the backend).
* `FRONTEND_PORT` — the local port on your host machine where the UI will be available.

### Step 2. Build and Run
Navigate to the root directory of the project (where the `docker-compose.yml` file is located) and run the following command:
```bash
docker-compose up --build -d 
```
The --build flag forces the images to be built from the Dockerfiles, and -d runs the containers in the background.

Step 3. Access the Application
After a successful startup, the services will be available at the following addresses:

API (backend): http://localhost:8000

Frontend: http://localhost:<Your_FRONTEND_PORT>

---

****✅ How to verify it works****
Local Verification
1. Container Status: Run the docker-compose ps command. Make sure both the drone-tax-backend and drone-tax-frontend containers have an Up status.

3. Checking Logs: To verify that the backend successfully started and connected to the database, check its logs:

    ```Bash
    docker logs drone-tax-backend 
    ```

  Thanks to the PYTHONUNBUFFERED=1 environment variable in the configuration, Python logs are streamed to the console in real-time without buffering.

**CI Verification (GitHub)**
- Push a new commit or create a Pull Request to the main branch.

-  Navigate to the Actions tab in your GitHub repository.

-  Open the triggered CI Pipeline workflow run.

-  Ensure all steps (dependency installation, linting, build) are completed with a green checkmark. If the pipeline fails, check the logs of the specific step (e.g., Lint Frontend) to find and fix the issue in the cod