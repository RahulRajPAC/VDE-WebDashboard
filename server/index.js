/* eslint-disable no-undef */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if running locally (e.g. via 'npm run dev') or via npx
// When running via npx, we want to look in the directory the user ran the command from
const isNpxExecution = process.env.npm_command !== 'run' && !process.argv[1]?.includes('nodemon');
const PROJECT_ROOT = isNpxExecution
    ? process.cwd()
    : path.resolve(__dirname, '..', '..');

const DOCKER_COMPOSE_FILE = path.join(PROJECT_ROOT, 'docker-compose.yaml');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Helper to get services from docker-compose.yaml
const getServicesConfig = () => {
    try {
        if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
            console.error('docker-compose.yaml not found at:', DOCKER_COMPOSE_FILE);
            return {};
        }
        const file = fs.readFileSync(DOCKER_COMPOSE_FILE, 'utf8');
        const parsed = yaml.parse(file);

        if (parsed && parsed.services) {
            return parsed.services;
        }
        return {};
    } catch (e) {
        console.error('Error parsing docker-compose.yaml:', e);
        return {};
    }
};

// Start docker-compose ps to get status
const getStatus = async () => {
    return new Promise((resolve) => {
        const cmd = spawn('docker-compose', ['ps', '-a', '--format', 'json'], { cwd: PROJECT_ROOT, shell: true });
        let output = '';
        cmd.stdout.on('data', (data) => { output += data.toString(); });
        cmd.on('close', () => {
            try {
                // formatting output can be tricky if multiple json objects are streamed, usually "docker compose ps --format json" outputs NDJSON (newline delimited json)
                const statuses = output.trim().split('\n').filter(Boolean).map(line => {
                    // eslint-disable-next-line no-unused-vars
                    try { return JSON.parse(line); } catch (e) { return null; }
                }).filter(Boolean);
                resolve(statuses);
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                resolve([]);
            }
        });
    });
};

// Endpoint for getting services
app.get('/api/services', async (req, res) => {
    const servicesConfig = getServicesConfig();
    const serviceNames = Object.keys(servicesConfig);
    const statuses = await getStatus(); // 2. Get list of running containers from Docker

    // Map status to service
    const serviceList = serviceNames.map(name => {
        // Find if this service has a running container
        const status = statuses.find(s => s.Service === name || s.Name === name || s.Service === `${path.basename(PROJECT_ROOT)}-${name}-1`);

        let port = 'N/A';
        const config = servicesConfig[name];
        if (config && config.ports && config.ports.length > 0) {
            const portMapping = config.ports[0];
            port = typeof portMapping === 'string' ? portMapping.split(':')[0] : (portMapping.published || portMapping.target || 'N/A');
        }

        let normalizedState = status ? status.State : 'uncreated';
        if (normalizedState === 'exited') {
            normalizedState = 'stopped';
        }

        let normalizedStatusPhrase = status ? status.Status : 'No status info';
        if (normalizedStatusPhrase.startsWith('Exited (')) {
            normalizedStatusPhrase = normalizedStatusPhrase.replace(/Exited \(\d+\)/, 'Stopped');
        }

        return {
            name,
            status: normalizedState,
            details: status ? { ...status, Status: normalizedStatusPhrase } : status,
            port
        };
    });

    res.json(serviceList);
});

// Endpoint for checking Docker Desktop status
app.get('/api/docker-status', (req, res) => {
    // We use "docker info" because it verifies both that the CLI exists and the daemon is responsive
    const cmd = spawn('docker', ['info', '--format', '{{json .}}']);

    let errorOutput = '';
    let responded = false;

    // Safety timeout: If Docker is Paused/Frozen, it hangs indefinitely. 
    // We cap the wait at 3 seconds to catch this state.
    const timeoutMsg = setTimeout(() => {
        if (!responded) {
            responded = true;
            cmd.kill(); // Kill the hanging process
            res.json({
                installed: true,
                running: false,
                error: 'TIMEOUT'
            });
        }
    }, 3000);

    let stdOutput = '';

    cmd.stdout.on('data', (data) => {
        stdOutput += data.toString();
    });

    cmd.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    cmd.on('close', (code) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutMsg);

        const combinedOutput = (stdOutput + errorOutput).toLowerCase();

        // If Docker explicitly responds saying it is manually paused, treat it as frozen
        if (combinedOutput.includes('manually paused')) {
            return res.json({
                installed: true,
                running: false,
                error: 'PAUSED'
            });
        }

        if (code === 0) {
            // Docker is installed and running
            res.json({ installed: true, running: true, error: null });
        } else {
            // If we reach the 'close' event, the docker binary was found and executed.
            // Any non-zero exit code here just means the daemon itself is down/unreachable.
            res.json({
                installed: true,
                running: false,
                error: errorOutput.trim()
            });
        }
    });

    cmd.on('error', (err) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeoutMsg);
        // If spawn completely fails (e.g., ENOENT because docker is not in PATH at all)
        res.json({ installed: false, running: false, error: err.message });
    });
});

// Endpoint to attempt starting Docker Desktop
app.post('/api/start-docker', (req, res) => {
    let command = '';
    const platform = process.platform;

    // Determine the correct launch command based on OS
    if (platform === 'darwin') { // macOS
        command = 'open -a Docker';
    } else if (platform === 'win32') { // Windows
        // Typical installation path
        command = 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"';
    } else if (platform === 'linux') { // Linux
        command = 'systemctl --user start docker-desktop';
    }

    if (!command) {
        return res.status(400).json({ success: false, error: 'Unsupported operating system for auto-start' });
    }

    const cmd = spawn(command, { shell: true });

    cmd.on('close', (code) => {
        if (code === 0) {
            res.json({ success: true, message: 'Docker start command executed' });
        } else {
            res.status(500).json({ success: false, error: `Command failed with code ${code}` });
        }
    });

    cmd.on('error', (err) => {
        res.status(500).json({ success: false, error: err.message });
    });
});

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('docker-action', ({ service, action }) => {
        // Special Action: Just refresh status for the frontend
        if (action === 'refresh_override') {
            io.emit('status-update');
            return;
        }

        // 1. VALIDATION: Only allow safe actions.
        const allowedActions = ['up', 'down', 'start', 'stop', 'restart', 'pull', 'logs', 'update'];
        if (!allowedActions.includes(action)) {
            socket.emit('output', { service, type: 'error', data: `Invalid action: ${action}` });
            return;
        }

        // 2. BUILD COMMAND: e.g., ['start', 'ans']
        let args = [action];
        if (action === 'update') {
            args = ['up', '-d', service];
        } else if (service && action !== 'up' && action !== 'down') {
            args.push(service);
        }

        // Special handling for logs to follow
        if (action === 'logs') {
            args.push('-f', '--tail=50');
        }

        console.log(`Running: docker-compose ${args.join(' ')}`);
        socket.emit('output', { service, type: 'info', data: `> docker-compose ${args.join(' ')}\r\n` });

        // 3. EXECUTE: Run the command on the server's terminal
        // "spawn" creates a new process for this command
        const cmd = spawn('docker-compose', args, {
            cwd: PROJECT_ROOT,
            shell: true,
            env: { ...process.env, FORCE_COLOR: '1' } // Force color output for better readability
        });
        // 4. STREAM OUTPUT: Send terminal text back to the frontend
        cmd.stdout.on('data', (data) => {
            // Send "stdout" (normal text) to the browser
            socket.emit('output', { service, type: 'stdout', data: data.toString() });
        });

        cmd.stderr.on('data', (data) => {
            const dataStr = data.toString();
            // Send "stderr" (error text) to the browser
            socket.emit('output', { service, type: 'stderr', data: dataStr });

            // Force an immediate UI status refresh if Docker is manually paused
            if (dataStr.toLowerCase().includes('manually paused')) {
                io.emit('status-update');
            }
        });

        cmd.on('close', (code) => {
            socket.emit('output', { service, type: 'exit', code });
            // Refresh status after operation
            io.emit('status-update');
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Helper to monitor docker events
const monitorDockerEvents = () => {
    // Using --json gives NDJSON
    const cmd = spawn('docker-compose', ['events', '--json'], { cwd: PROJECT_ROOT, shell: true });
    // console.log('Monitoring docker events1', cmd);
    cmd.stdout.on('data', (data) => {
        // console.log('Monitoring docker events', data);
        const lines = data.toString().split('\n').filter(Boolean);
        lines.forEach(line => {
            try {
                const event = JSON.parse(line);
                // Simplify the service name (remove project prefix if easy, else use available field)
                const serviceName = event.service || event.container || 'System';

                // Formulate a friendly message
                let message = `Event: ${event.action}`;
                if (event.attributes && event.attributes.image) {
                    message += ` (${event.attributes.image})`;
                }

                io.emit('output', {
                    service: serviceName,
                    type: 'event', // Special type for timeline
                    data: message
                });

                // Refresh status on state change
                if (['start', 'stop', 'die', 'kill', 'create', 'destroy'].includes(event.action)) {
                    io.emit('status-update');
                }
            } catch (e) {
                console.log(e);
            }
        });
    });

    return cmd;
};

// Start monitoring events
// let eventMonitor =
monitorDockerEvents();

if (isNpxExecution) {
    // Serve the static files from the React app
    app.use(express.static(path.join(__dirname, '../dist')));

    // Handle React routing, return all requests to React app
    // Using app.use() instead of app.get('*') to be compatible with Express 5
    app.use((req, res) => {
        res.sendFile('index.html', { root: path.join(__dirname, '../dist') });
    });
}

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Docker Control Server running on port ${PORT}`);
    console.log(`Looking for docker-compose.yaml at: ${DOCKER_COMPOSE_FILE}`);
});
