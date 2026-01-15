# Undercooked 🍔

A real-time multiplayer cooking game where teams race to fulfill burger orders before they expire. Inspired by Overcooked, this game challenges teams to manage ingredients, complete orders quickly, and avoid strikes in a fast-paced kitchen environment.

## Game Features

### Core Gameplay
- **Time-based Orders**: Random burger orders appear with countdown timers
- **Team Competition**: Multiple teams compete for the highest score
- **Lives System**: Teams have 3 lives; failed orders result in strikes
- **Real-time Updates**: WebSocket-powered live game state synchronization
- **Sound Effects**: Audio feedback for orders, completions, and failures

### Game Screens
- **Game Display**: Large screen showing active orders, score, and team status
- **Game Master Control**: Admin panel to manage teams, start/end rounds, and submit orders
- **Leaderboard**: Historical results and rankings across all game sessions

### Technical Features
- Full-stack TypeScript application
- MongoDB for data persistence
- WebSocket communication for real-time gameplay
- Responsive React frontend with Tailwind CSS
- Docker-based development environment
- Internationalization (i18n) support

## Quick Start

### Prerequisites
- Docker Desktop
- VS Code with Dev Containers extension

### Setup Instructions

1. **Clone and Open**
   ```bash
   git clone <repository-url>
   cd undercooked
   ```

2. **Open in Dev Container**
   - Open folder in VS Code
   - Select "Reopen in Container" when prompted
   - Wait for the container to build

3. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` if needed (defaults work out of the box)

4. **Start Services**
   ```bash
   docker compose up --build
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

### First Game

1. Open the Game Master control panel
2. Create a team
3. Start a new round
4. Orders will appear automatically
5. Submit ingredients to fulfill orders
6. Watch the score climb on the game display!

## Environment Variables

### Backend (`backend/.env`)
- `PORT=3000` - Backend server port
- `MONGO_URI=mongodb://mongo:27017/undercooked` - MongoDB connection string

## Development

- **Hot Reload**: Changes to code automatically refresh both frontend and backend
- **Vite Dev Server**: Frontend runs with `--host` for container access
- **File Watching**: On Windows, if file watching is flaky, set `CHOKIDAR_USEPOLLING=true` for backend

## Project Structure

```
undercooked/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── models/   # MongoDB schemas
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Game logic
│   │   └── websocket/# Socket.io handlers
│   └── Dockerfile
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api/         # API & WebSocket clients
│   │   └── locales/     # i18n translations
│   └── Dockerfile
└── docker-compose.yml
```

## Tech Stack

**Frontend**: React, TypeScript, Vite, Tailwind CSS, Socket.io Client, i18next  
**Backend**: Node.js, Express, TypeScript, Socket.io, Mongoose  
**Database**: MongoDB  
**Infrastructure**: Docker, Docker Compose
