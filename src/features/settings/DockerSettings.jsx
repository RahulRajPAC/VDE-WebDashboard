import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Activity, Play, Square, RotateCw, Download, Upload, Terminal, ChevronDown, Monitor, AlertTriangle, WifiOff, Loader2, HelpCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const CollapsibleServiceRow = ({ service, socket, logs, onAction, disabled }) => {
    const isRunning = service.status === 'running';
    const isUncreated = service.status === 'uncreated';
    const [isOpen, setIsOpen] = useState(false);

    // Disable all actions if parent is disabled
    const isDisabled = disabled;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border rounded-md bg-card"
        >
            <CollapsibleTrigger asChild disabled={isDisabled}>
                <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center space-x-4">
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <h3 className="font-semibold capitalize text-sm">{service.name}</h3>
                            <p className="text-xs text-muted-foreground">{service.details?.Status || 'No status info'}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Badge variant={isRunning ? "default" : "destructive"}>
                            {service.status || 'unknown'}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 border-t bg-muted/20">
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onAction(service.name, 'start')}
                        disabled={isRunning || isUncreated || isDisabled}
                    >
                        <Play className="mr-2 h-3 w-3" /> Start
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onAction(service.name, 'stop')}
                        disabled={!isRunning || isDisabled}
                    >
                        <Square className="mr-2 h-3 w-3" /> Stop
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onAction(service.name, 'restart')}
                        disabled={isUncreated || isDisabled}
                    >
                        <RotateCw className="mr-2 h-3 w-3" /> Restart
                    </Button>
                    <ConfirmButton
                        actionName="Pull"
                        description={`Are you sure you want to pull the latest image for ${service.name}? This will fetch the latest updates from the Dockerhub repository.`}
                        onConfirm={() => onAction(service.name, 'pull')}
                        variant="outline"
                        disabled={isDisabled}
                        className="w-full justify-start cursor-pointer"
                    >
                        <Download className="mr-2 h-3 w-3" /> Pull
                    </ConfirmButton>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => onAction(service.name, 'logs')}
                        disabled={isUncreated || isDisabled}
                    >
                        <Terminal className="mr-2 h-3 w-3" /> Logs
                    </Button>
                </div>
                <div className="mt-4 bg-black rounded-md h-[200px] overflow-hidden text-xs font-mono p-2 border border-border">
                    <ScrollArea className="h-full w-full">
                        {logs[service.name]?.map((line, i) => (
                            <div key={i} className={`whitespace-pre-wrap ${line?.startsWith?.('EXECUTING ACTION') ? 'text-yellow-400 font-bold bg-yellow-400/10 py-1 px-2 rounded my-2 border-l-2 border-yellow-400' : 'text-green-400'}`}>
                                {line}
                            </div>
                        )) || <span className="text-muted-foreground italic">No logs...</span>}
                    </ScrollArea>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

const ConfirmButton = ({ actionName, description, onConfirm, variant = "default", children, disabled, validationKey, className }) => {
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // If disabled, we render a tooltip wrapper instead of the functional dialog
    if (disabled) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="inline-block">
                            <Button variant={variant} disabled className="pointer-events-none opacity-50">
                                {children}
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>System is offline. Reconnect to perform actions.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    const isActionDisabled = validationKey ? inputValue !== validationKey : false;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setInputValue("");
        }}>
            <AlertDialogTrigger asChild>
                <Button variant={variant} className={className}>{children}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 mt-2">
                            <p>{description}</p>
                            {validationKey && (
                                <div className="space-y-2 mt-4 text-foreground">
                                    <p className="text-sm font-medium">
                                        Please type <span className="font-bold select-all bg-muted px-1.5 py-0.5 rounded">{validationKey}</span> to confirm.
                                    </p>
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={validationKey}
                                        className="h-9"
                                    />
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            if (isActionDisabled) {
                                e.preventDefault();
                                return;
                            }
                            onConfirm();
                            setIsOpen(false);
                        }}
                        disabled={isActionDisabled}
                        className={`${variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""} ${isActionDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        Confirm {actionName}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

import { useSocket } from '../../contexts/SocketContext';

// ... (imports remain)

export default function DockerSettings() {
    const { socket, isConnected, setPendingPull, updateDialogOpen, setUpdateDialogOpen, pendingUpdateService, setPendingUpdateService } = useSocket();
    const [services, setServices] = useState([]);
    const [logs, setLogs] = useState({});
    const [globalLogs, setGlobalLogs] = useState([]);
    const [isGlobalLogsOpen, setIsGlobalLogsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchServices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:3001/api/services');
            if (!res.ok) {
                throw new Error('Failed to connect to backend service.');
            }
            const data = await res.json();
            setServices(data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
            setError('Is the backend server running? Could not fetch service configuration.');
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleOutput = ({ service, type, data }) => {
            if (service) {
                setLogs(prev => ({
                    ...prev,
                    [service]: [...(prev[service] || []).slice(-99), data]
                }));
            } else {
                setGlobalLogs(prev => [...prev.slice(-49), data]);
            }
        };

        const handleStatusUpdate = () => {
            fetchServices();
        };

        // Attach listeners specifically for Logs (Update logic is global)
        socket.on('output', handleOutput);
        socket.on('status-update', handleStatusUpdate);

        return () => {
            socket.off('output', handleOutput);
            socket.off('status-update', handleStatusUpdate);
        };
    }, [socket]);

    const handleAction = (service, action) => {
        if (socket && isConnected) {
            if (action === 'pull') {
                setPendingPull(service);
            }

            const marker = `EXECUTING ACTION: [${action.toUpperCase()}] on ${service}`;
            setLogs(prev => ({
                ...prev,
                [service]: [...(prev[service] || []).slice(-99), marker]
            }));

            socket.emit('docker-action', { service, action });
        }
    };

    const handleGlobalAction = (action) => {
        if (socket && isConnected) {
            const marker = `EXECUTING GLOBAL SYSTEM ACTION: [COMPOSE ${action.toUpperCase()}]`;
            setGlobalLogs(prev => [...prev.slice(-49), marker]);

            socket.emit('docker-action', { service: null, action });
            setIsGlobalLogsOpen(true);
        }
    }

    const handleUpdate = () => {
        if (socket && isConnected && pendingUpdateService) {
            const marker = `EXECUTING ACTION: [UPDATE] on ${pendingUpdateService}`;
            setLogs(prev => ({
                ...prev,
                [pendingUpdateService]: [...(prev[pendingUpdateService] || []).slice(-99), marker]
            }));

            socket.emit('docker-action', { service: pendingUpdateService, action: 'update' });
            setUpdateDialogOpen(false);
            setPendingUpdateService(null);
        }
    };

    const allUncreated = services.length > 0 && services.every(s => s.status === 'uncreated');
    const anyRunning = services.some(s => s.status === 'running');

    return (
        <div className="space-y-6">
            {/* System Status Alert */}
            {(!isConnected || error) && (
                <Alert variant="destructive">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>System Offline</AlertTitle>
                    <AlertDescription>
                        {error || "Lost connection to the Docker control server. Controls are disabled."}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-4">
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Global Controls
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="cursor-pointer shadow-sm">
                                        System Actions <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56 p-2 space-y-2">
                                    <DropdownMenuLabel>Docker Compose</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <ConfirmButton
                                        actionName="Up"
                                        description="This will start all services defined in docker-compose.yaml. It may recreate containers if configuration has changed. Existing data in non-persistent volumes might be reset."
                                        onConfirm={() => handleGlobalAction('up')}
                                        disabled={!isConnected}
                                        validationKey="I agree to Compose Up"
                                        className="w-full justify-start cursor-pointer"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Compose Up
                                    </ConfirmButton>

                                    <ConfirmButton
                                        actionName="Start"
                                        description="This will start existing stopped containers. No data will be lost, and containers will resume from their previous state."
                                        onConfirm={() => handleGlobalAction('start')}
                                        variant="outline"
                                        disabled={!isConnected || allUncreated}
                                        className="w-full justify-start cursor-pointer border-transparent hover:bg-muted"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Compose Start
                                    </ConfirmButton>

                                    <ConfirmButton
                                        actionName="Stop"
                                        description="This will stop all running containers. State is preserved, and you can resume later with 'Start'."
                                        onConfirm={() => handleGlobalAction('stop')}
                                        variant="outline"
                                        disabled={!isConnected || !anyRunning}
                                        className="w-full justify-start cursor-pointer border-transparent hover:bg-muted"
                                    >
                                        <Square className="h-4 w-4 mr-2" />
                                        Compose Stop
                                    </ConfirmButton>

                                    <ConfirmButton
                                        actionName="Down"
                                        description="WARNING: This will stop and REMOVE all containers and networks. Any data not stored in persistent volumes will be PERMANENTLY LOST."
                                        onConfirm={() => handleGlobalAction('down')}
                                        variant="destructive"
                                        disabled={!isConnected}
                                        validationKey="I agree to Compose Down"
                                        className="w-full justify-start cursor-pointer mt-2"
                                    >
                                        <Square className="h-4 w-4 mr-2" />
                                        Compose Down
                                    </ConfirmButton>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Drawer open={isGlobalLogsOpen} onOpenChange={setIsGlobalLogsOpen}>
                                <DrawerTrigger asChild>
                                    <Button variant="default" size="sm" className="cursor-pointer bg-green-600 hover:bg-green-700 text-white shadow-md">
                                        <Terminal className="w-4 h-4 mr-2" />
                                        View Global Logs
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent>
                                    <div className="mx-auto w-full max-w-4xl">
                                        <DrawerHeader>
                                            <DrawerTitle>Global System Logs</DrawerTitle>
                                            <DrawerDescription>Live output stream for Compose Up, Compose Down, and System actions.</DrawerDescription>
                                        </DrawerHeader>
                                        <div className="p-4">
                                            <div className="bg-black rounded-md h-[50vh] overflow-hidden text-xs font-mono p-4 border border-border">
                                                <ScrollArea className="h-full w-full">
                                                    {globalLogs.length > 0 ? (
                                                        globalLogs.map((log, i) => (
                                                            <div key={i} className={`whitespace-pre-wrap ${log?.startsWith?.('EXECUTING GLOBAL SYSTEM ACTION') ? 'text-blue-400 font-bold bg-blue-400/10 py-1 px-2 rounded my-2 border-l-2 border-blue-400' : 'text-emerald-400'}`}>
                                                                {log}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground italic">
                                                            No recent global system output...
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                        </div>
                                        <DrawerFooter className="flex-row justify-end space-x-2">
                                            <Button
                                                variant="default"
                                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-md"
                                                onClick={() => {
                                                    const marker = `EXECUTING GLOBAL SYSTEM ACTION: [COMPOSE LOGS]`;
                                                    setGlobalLogs(prev => [...prev.slice(-49), marker]);
                                                    socket.emit('docker-action', { service: null, action: 'logs' })
                                                }}
                                            >
                                                <Terminal className="w-4 h-4 mr-2" /> Stream Live Logs
                                            </Button>
                                            <DrawerClose asChild>
                                                <Button variant="outline" className="cursor-pointer">Close Logs</Button>
                                            </DrawerClose>
                                        </DrawerFooter>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        </div>
                        <CardDescription className="mt-1">Manage the entire application stack</CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Drawer>
                            <DrawerTrigger asChild>
                                <Button variant="default" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Interactive Docker Guide
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <div className="mx-auto w-full max-w-3xl">
                                    <DrawerHeader>
                                        <DrawerTitle>Docker Application Guide</DrawerTitle>
                                        <DrawerDescription>Learn what each action does and how to manage the simulator containers.</DrawerDescription>
                                    </DrawerHeader>
                                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                                <h4 className="font-semibold text-primary flex items-center gap-2"><Play className="h-4 w-4" /> Compose Up</h4>
                                                <p className="text-sm text-muted-foreground mt-2">Spins up fresh containers from your images and maps the network ports. This command is required if you have recently run 'Compose Down'.</p>
                                            </div>
                                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                                <h4 className="font-semibold text-primary flex items-center gap-2"><Square className="h-4 w-4" /> Compose Down</h4>
                                                <p className="text-sm text-muted-foreground mt-2">Fundamentally destroys the running containers and networks. Use this when you are completely finished with a session to save RAM.</p>
                                            </div>
                                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                                <h4 className="font-semibold text-primary flex items-center gap-2"><Play className="h-4 w-4" /> Compose Start</h4>
                                                <p className="text-sm text-muted-foreground mt-2">Starts all previously created but stopped containers simultaneously. Allows you to resume operations very fast.</p>
                                            </div>
                                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                                <h4 className="font-semibold text-primary flex items-center gap-2"><Square className="h-4 w-4" /> Compose Stop</h4>
                                                <p className="text-sm text-muted-foreground mt-2">Safely suspends and stops all currently running containers across the entire system without wiping their networks.</p>
                                            </div>
                                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                                <h4 className="font-semibold text-primary flex items-center gap-2"><Play className="h-4 w-4" /> Local Start/Stop</h4>
                                                <p className="text-sm text-muted-foreground mt-2">Safely pauses and resumes an individual container row. Very useful for testing network downtime or simulating offline failures.</p>
                                            </div>
                                            <div className="rounded-lg border p-4 shadow-sm bg-muted/20">
                                                <h4 className="font-semibold text-primary flex items-center gap-2"><Download className="h-4 w-4" /> Pull Updates</h4>
                                                <p className="text-sm text-muted-foreground mt-2">Downloads the absolute newest registry binary for a specific service. It will prompt you to apply it and recreate!</p>
                                            </div>
                                        </div>
                                        <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                            <Terminal className="h-4 w-4 !text-blue-800 dark:!text-blue-300" />
                                            <AlertTitle>Logging Information</AlertTitle>
                                            <AlertDescription>
                                                Individual container standard output feeds stream straight into their local "Logs" dropdown!
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                    <DrawerFooter>
                                        <DrawerClose asChild>
                                            <Button variant="outline" className="cursor-pointer">Close Guide</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </div>
                            </DrawerContent>
                        </Drawer>
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Service Configuration</h2>
                    {isLoading && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fetching configuration...
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {isLoading && services.length === 0 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-3 w-[100px]" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))
                    ) : (
                        services.map(service => (
                            <CollapsibleServiceRow
                                key={service.name}
                                service={service}
                                socket={socket}
                                logs={logs}
                                onAction={handleAction}
                                disabled={!isConnected}
                            />
                        ))
                    )}

                    {!isLoading && services.length === 0 && !error && (
                        <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
                            No services found in docker-compose.yaml
                        </div>
                    )}
                </div>
            </div>

            {/* Update Confirmation Dialog */}
            <AlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update {pendingUpdateService}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The image for <span className="font-semibold">{pendingUpdateService}</span> has been successfully pulled.
                            Would you like to recreate the container now to apply the new image?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setPendingUpdateService(null); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdate}>Update & Restart</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
