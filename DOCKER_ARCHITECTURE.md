# Web Dashboard & Docker Architecture

This document explains the high-level architecture of the VDE Web Dashboard and how it controls the local Docker environment to manage the backend simulator services.

## Overview

The VDE Web Dashboard serves as a visual control plane for the backend simulator services. It effectively bridges a web-based React frontend with the host machine's command-line Docker daemon. 

### Architecture Flow
1. **Frontend (React/Vite)**: Provides the user interface for controlling services (Start, Stop, Restart, Pull, View Logs). 
2. **Backend (Node.js/Express)**: A lightweight local server that acts as a proxy between the web browser and the system terminal.
3. **Socket.IO**: Establishes a real-time, bi-directional connection for streaming terminal output (stdout/stderr) from Docker commands exactly as they execute.
4. **Execution Layer (`child_process.spawn`)**: The Node.js backend executes raw `docker` and `docker-compose` shell commands directly against the host's terminal.
5. **Docker Daemon**: Executes the commands to manage the isolated containers defined in the `docker-compose.yaml` file (`ans`, `ltn`, `surveys`, `flightdataservice`).

---

## Core Docker Command Flow

The integration revolves around a continuous feedback loop between the UI, the Node.js proxy, and the Docker CLI. 

### 1. Global Status Polling (`GET /api/docker-status`)
The entire application is guarded against missing or frozen Docker states.
- **Trigger**: The frontend polls this endpoint every 10 seconds.
- **Command Execute**: `docker info --format '{{json .}}'`
- **Purpose**: Verifies that the Docker CLI is installed and the daemon is responsive. 
- **Error Handling**: 
  - If the command hangs for > 3 seconds, the backend actively kills the process and reports `"TIMEOUT"`, indicating a Frozen engine.
  - The backend specifically scrapes the output for `"manually paused"` and actively reports the `"PAUSED"` state to prompt the user to unpause from their Whale menu.

### 2. Service State Polling (`GET /api/services`)
This provides the real-time data for the glowing status indicators in the sidebar and the specific state of each service row.
- **Trigger**: Fetched on initial app load and immediately upon receiving a `status-update` WebSocket event.
- **Command Execute**: `docker-compose ps --format json`
- **Purpose**: Parses the JSON array of containers to retrieve the exact real-time running/stopped/uncreated status of all orchestrations in `docker-compose.yaml`. 

### 3. Asynchronous Container Actions (WebSockets)
When a user clicks an interactive button (e.g., "Start") in the specific service UI:
1. **Emit**: The frontend emits a `docker-action` WebSocket event with a payload: `{ service: 'ans', action: 'start' }`.
2. **Execute**: The Node.js backend intercepts the action and spawns a new terminal process: `spawn('docker-compose', ['start', 'ans'])`.
3. **Stream Output**: The backend attaches event listeners to the terminal's `cmd.stdout` and `cmd.stderr`. As Docker prints progress text to the terminal, the backend instantly streams those strings back to the frontend via `output` WebSocket events.
4. **UI Feedback**: The frontend intercepts the `output` stream and renders it inside the specific service's log window perfectly mirroring a real terminal.
5. **Completion Cascade**: Upon command exit, the backend detects the termination signal and immediately broadcasts a `status-update` WebSocket event to all connected clients.
6. **UI Refresh**: The frontend receives the `status-update`, blindly fires a new `GET /api/services` fetch, and seamlessly updates all glowing red/green sidebar lights to match the new container states.

### 4. Global Interventions
The Dashboard also executes full system orchestrations via the "Global Controls" dropdown:
- **Compose Up**: Runs `docker-compose up -d`. Spins up all containers mapped in `docker-compose.yaml`. Creates networks and binds host ports if they do not yet exist.
- **Compose Start/Stop**: Suspends and resumes the entire fleet simultaneously without fundamentally destroying the underlying sandbox networks.
- **Compose Down**: Runs `docker-compose down`. A destructive command that stops and entirely uncreates the containers and unbinds networks to fully purge RAM usage.

---

## Technical Constraints & Cloud Portability 

Because this architecture was designed for extreme simplicity regarding distribution to other internal developers:
- It relies entirely on `child_process.spawn('docker-compose')`, meaning it intrinsically assumes it is running on a local developer machine that has full OS access and the Docker CLI natively in its `$PATH`.
- This exact Node.js codebase **cannot be hosted natively on a Cloud provider** (like Vercel, AWS Lambda, or Heroku) because those managed environments do not provide access to a local, naked Docker daemon or cross-platform desktop UI interactions (like `open -a Docker` for Mac auto-starting). 

To migrate this exact dashboard to become a true Cloud-Native application, the Node.js backend would have to abandon all local `child_process` CLI scripts in favor of officially authenticated Cloud SDKs (like the AWS SDK `@aws-sdk/client-ecs`) to instruct the cloud infrastructure to allocate containers rather than a local terminal.
