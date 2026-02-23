import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    // Global Event State (e.g., Update Dialog)
    const [pendingUpdateService, setPendingUpdateService] = useState(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const pendingPullRef = useRef(null);

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

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const setPendingPull = (service) => {
        pendingPullRef.current = service;
    };

    const value = {
        socket,
        isConnected,
        updateDialogOpen,
        setUpdateDialogOpen,
        pendingUpdateService,
        setPendingUpdateService,
        setPendingPull
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
