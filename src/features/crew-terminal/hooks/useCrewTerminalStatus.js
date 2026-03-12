import { useState, useEffect } from 'react';

const getBaseUrl = () => `http://${window.location.hostname}:50603`;

export default function useCrewTerminalStatus() {
    const [clientsConnected, setClientsConnected] = useState(0);
    const [isFlightOpen, setIsFlightOpen] = useState(false);
    const [serverLogs, setServerLogs] = useState('');
    const [fetchingLogs, setFetchingLogs] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchStatus = async () => {
            try {
                const response = await fetch(`${getBaseUrl()}/api/status`);
                const data = await response.json();
                if (isMounted) {
                    if (data.clientsConnected !== undefined) setClientsConnected(data.clientsConnected);
                    if (data.isFlightOpen !== undefined) setIsFlightOpen(data.isFlightOpen);
                }
            } catch {
                // Silently ignore polling errors
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchServerLogs = async () => {
        setFetchingLogs(true);
        try {
            const response = await fetch(`${getBaseUrl()}/api/logs`);
            const data = await response.json();
            setServerLogs(data.logs || 'No logs found.');
        } catch {
            setServerLogs('Error fetching logs. Ensure server is running.');
        } finally {
            setFetchingLogs(false);
        }
    };

    // Return an explicit modifier for UI
    return {
        clientsConnected,
        isFlightOpen,
        setIsFlightOpen, // needed by CrewTerminalPage to mock locally toggle
        serverLogs,
        fetchingLogs,
        showLogs,
        setShowLogs,
        fetchServerLogs
    };
}
