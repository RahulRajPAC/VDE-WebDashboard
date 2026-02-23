# Web Dashboard & Docker Control Panel

This project is a React-based web dashboard that provides a graphical interface for monitoring and controlling Docker services defined in the project's `docker-compose.yaml`. It includes a backend server that acts as a bridge between the web UI and the host system's Docker CLI.

## 🚀 Features

-   **Service Monitoring**: Real-time status display (Running/Stopped) for all services in `docker-compose.yaml`.
-   **Docker Control Panel**:
    -   **Start / Stop / Restart**: Control individual services with a click.
    -   **Pull**: Update service images.
    -   **Logs**: View real-time streaming logs for each service directly in the UI.
    -   **Compose Control**: Global `docker-compose up` and `docker-compose down` actions.
-   **Real-time Updates**: Uses WebSockets (`socket.io`) for instant feedback and log streaming.
-   **Modern UI**: Built with Shadcn/UI, Tailwind CSS, and Lucide Icons.

## 🛠️ Technology Stack

### Frontend
-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Shadcn/UI](https://ui.shadcn.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **WebSocket Client**: `socket.io-client`

### Backend
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Server**: [Express](https://expressjs.com/)
-   **WebSocket Server**: [Socket.io](https://socket.io/)
-   **Process Management**: Node.js `child_process` to execute `docker-compose` commands.
-   **YAML Parsing**: `yaml` package to read `docker-compose.yaml`.

## 📋 Prerequisites

-   **Node.js**: v18 or higher.
-   **Docker**: Docker Desktop must be installed and running.
-   **Docker Compose**: The `docker-compose` executable must be available in your system path.

## ⚙️ Installation & Setup

1.  **Navigate to the dashboard directory**:
    ```bash
    cd web-dashboard
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## 🏃 Run the Application

To start both the Frontend (Vite) and the Backend Server concurrently:

```bash
npm run dev
```

-   **Frontend**: `http://localhost:5173` (or the next available port)
-   **Backend**: `http://localhost:3001`

## 🕹️ Usage

1.  Open the dashboard in your browser.
2.  The **Docker Control Panel** will automatically list all services found in your root `docker-compose.yaml`.
3.  **Manage Services**:
    -   Click **Start** to run a service.
    -   Click **Stop** to halt a running service.
    -   Click **Logs** to view the live output stream from the container.
4.  **Global Actions**: Use the "Compose Up" and "Compose Down" buttons at the top of the panel to manage the entire stack.

## 📂 Project Structure

```text
web-dashboard/
├── server/
│   └── index.js           # Backend server (Express + Socket.io)
├── src/
│   ├── components/
│   │   └── ui/            # Reusable UI components (Card, Button, Badge, etc.)
│   ├── features/
│   │   └── dashboard/
│   │       ├── DashboardPage.jsx      # Main dashboard layout
│   │       └── DockerControlPanel.jsx # Docker management component
│   └── App.jsx
├── package.json           # Defined scripts: "dev", "server", "build"
└── vite.config.js         # Vite configuration
```

## 🔧 Backend Details

The backend server (`server/index.js`) performs the following:
1.  **Reads `docker-compose.yaml`**: Identifies defined services.
2.  **Exposes API**: `GET /api/services` returns the list of services and their current status.
3.  **WebSocket Handlers**: Listens for events like `start`, `stop`, `logs` and executes `spawn('docker-compose', [action, service])`.
4.  **Streams Output**: stdout and stderr from Docker commands are streamed back to the frontend via WebSockets.
