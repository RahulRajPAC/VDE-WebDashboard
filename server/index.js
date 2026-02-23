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
const PROJECT_ROOT = path.resolve(__dirname, '..', '..'); // Assuming web-dashboard is inside project root
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
                    try { return JSON.parse(line); } catch (e) { return null; }
                }).filter(Boolean);
                resolve(statuses);
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

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('docker-action', ({ service, action }) => {
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
            // Send "stderr" (error text) to the browser
            socket.emit('output', { service, type: 'stderr', data: data.toString() });
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

            }
        });
    });

    return cmd;
};

// Start monitoring events
let eventMonitor = monitorDockerEvents();

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Docker Control Server running on port ${PORT}`);
    console.log(`Looking for docker-compose.yaml at: ${DOCKER_COMPOSE_FILE}`);
});
