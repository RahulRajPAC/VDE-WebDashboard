import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    // Docker Status State
    const [dockerStatus, setDockerStatus] = useState({
        installed: true,
        running: true,
        loading: true,
        error: null
    });

    // Global Event State (e.g., Update Dialog)
    const [pendingUpdateService, setPendingUpdateService] = useState(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const pendingPullRef = useRef(null);

    // Global Services State for the Sidebar status indicators
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState(null);

    const fetchServices = async () => {
        try {
            setServicesError(null);
            const res = await fetch('http://localhost:3001/api/services');
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            } else {
                setServicesError('Failed to fetch service configuration.');
            }
        } catch (error) {
            console.error('Failed to fetch services in context:', error);
            setServicesError('Is the backend server running? Could not fetch service configuration.');
        } finally {
            setServicesLoading(false);
        }
    };

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Global Listener for Pull Completion
        newSocket.on('output', ({ service, type, code }) => {
            // Check for successful pull completion
            // MUST ensure pendingPullRef.current is not null, otherwise global actions (service=null) matches pendingPull=null
            if (type === 'exit' && code === 0 && pendingPullRef.current && pendingPullRef.current === service) {
                setPendingUpdateService(service);
                setUpdateDialogOpen(true);
                pendingPullRef.current = null;
            }
        });

        // Whenever any docker action finishes, re-fetch the services to update the glowing sidebar dots
        newSocket.on('status-update', () => {
            fetchServices();
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Function to check Docker status
    const checkDockerStatus = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/docker-status');
            if (res.ok) {
                const data = await res.json();
                setDockerStatus({
                    ...data,
                    loading: false
                });
            } else {
                setDockerStatus(prev => ({ ...prev, loading: false, error: 'Failed to fetch status' }));
            }
        } catch (err) {
            setDockerStatus({
                installed: false,
                running: false,
                loading: false,
                error: 'Backend offline or unreachable'
            });
        }
    };

    // Initial check and periodic polling every 10 seconds
    useEffect(() => {
        checkDockerStatus();
        fetchServices();
        const interval = setInterval(() => {
            checkDockerStatus();
            fetchServices();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const setPendingPull = (service) => {
        pendingPullRef.current = service;
    };

    const value = {
        socket,
        isConnected,
        dockerStatus,
        checkDockerStatus,
        updateDialogOpen,
        setUpdateDialogOpen,
        pendingUpdateService,
        setPendingUpdateService,
        setPendingPull,
        services,
        servicesLoading,
        servicesError,
        fetchServices
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
