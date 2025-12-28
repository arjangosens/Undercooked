# Undercooked (Barebones)

Minimal split frontend/backend with MongoDB and dev containers.

## Quick Start

1. Install Docker Desktop and VS Code with Dev Containers extension.
2. Open this folder in VS Code and "Reopen in Container".
3. Copy env: `backend/.env.example` to `backend/.env` and adjust if needed.
4. Start services:

```bash
# inside the dev container
docker compose up --build
```

5. Frontend: http://localhost:5173
6. Backend health: http://localhost:3000/health

## Env
- backend `PORT=3000`
- backend `MONGO_URI=mongodb://mongo:27017/undercooked`

## Notes
- Hot reload via bind mounts; Vite runs with `--host`.
- On Windows, if file watching is flaky, set `CHOKIDAR_USEPOLLING=true` for backend.
