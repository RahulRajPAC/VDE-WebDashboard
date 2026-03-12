import React, { useEffect, useState } from 'react';
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
import { Activity, Play, Square, RotateCw, Download, Upload, Terminal, Trash2, ChevronDown, Monitor, AlertTriangle, WifiOff, Loader2, HelpCircle, Search } from 'lucide-react';
import Joyride from 'react-joyride';
import { useTour } from '../../contexts/TourContext';
import { settingsSteps } from '../../config/tourSteps';


const CollapsibleServiceRow = ({ service, logs, setLogs, onAction, disabled }) => {
    const isRunning = service.status === 'running';
    const isUncreated = service.status === 'uncreated';
    const [isOpen, setIsOpen] = useState(false);

    // Disable all actions if parent is disabled
    const isDisabled = disabled;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border border-border/50 rounded-xl bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-border overflow-hidden group joyride-service-row"
        >
            <CollapsibleTrigger asChild disabled={isDisabled}>
                <div className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2.5 rounded-lg group-hover:bg-primary/15 transition-colors">
                            <Monitor className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold capitalize text-base tracking-tight">{service.name}</h3>
                            <p className="text-xs text-muted-foreground/80 mt-0.5">{service.details?.Status || 'No status info'}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-1.5 mr-2">
                            {!isRunning && !isUncreated && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="default"
                                                className="h-8 w-8 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAction(service.name, 'start');
                                                }}
                                                disabled={isDisabled}
                                            >
                                                <Play className="h-4 w-4 joyride-service-start cursor-pointer" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Start Container</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {isRunning && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <ConfirmButton
                                                actionName="Stop"
                                                description={
                                                    <span>
                                                        Are you sure you want to stop <strong>{service.name}</strong>? <br /><br />
                                                        <strong className="text-xl text-red-600 font-semibold">Warning: </strong>
                                                        <strong className="text-lg text-red-500">Stopping the container will "erase" any modified JSON overrides from memory and restore the original mock JSON files.</strong>
                                                    </span>
                                                }
                                                onConfirm={(e) => {
                                                    // Stop event propagation if triggered via the dialog
                                                    if (e) e.stopPropagation();
                                                    onAction(service.name, 'stop');
                                                }}
                                                variant="destructive"
                                                className="h-8 w-8 rounded-md bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all p-0"
                                                disabled={isDisabled}
                                                // Prevent the collapsible wrapper from opening when clicking this button
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Square className="h-4 w-4 joyride-service-start" />
                                            </ConfirmButton>
                                        </TooltipTrigger>
                                        <TooltipContent>Stop Container</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>

                        <Badge
                            variant="outline"
                            className={`px-2.5 py-0.5 border-transparent font-medium ${isRunning ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                isUncreated ? 'bg-muted text-muted-foreground' :
                                    'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isRunning ? 'bg-emerald-500 dark:bg-emerald-400' :
                                isUncreated ? 'bg-muted-foreground/50' :
                                    'bg-red-500 dark:bg-red-400'
                                }`} />
                            {service.status || 'unknown'}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 md:p-5 pt-0 border-t border-border/50 bg-muted/20 pb-5">
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    {/* Operational Actions */}
                    <div className="flex flex-wrap gap-2">
                        <ConfirmButton
                            actionName="Pull"
                            description={`Are you sure you want to pull the latest image for ${service.name}? This will fetch the latest updates from the Dockerhub repository.`}
                            onConfirm={() => onAction(service.name, 'pull')}
                            variant="secondary"
                            disabled={isDisabled}
                            className="cursor-pointer shadow-sm border border-border/50 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-colors"
                        >
                            <Download className="mr-2 h-3.5 w-3.5 text-blue-500" /> Update Service
                        </ConfirmButton>
                    </div>

                    {/* Logging Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="shadow-sm border border-border/50 hover:bg-indigo-500/10 hover:text-indigo-600 hover:border-indigo-500/30 transition-colors"
                            onClick={() => onAction(service.name, 'logs')}
                            disabled={isUncreated || isDisabled}
                        >
                            <Terminal className="mr-2 h-3.5 w-3.5 text-indigo-500" /> View Logs
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="shadow-sm border border-border/50 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-colors"
                            onClick={() => setLogs(prev => ({ ...prev, [service.name]: [] }))}
                            disabled={!logs[service.name] || logs[service.name].length === 0}
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" /> Clear Logs
                        </Button>
                    </div>
                </div>
                <div className="mt-5 bg-black rounded-lg overflow-hidden text-xs font-mono p-3 border border-border/50 shadow-inner">
                    <ScrollArea className="h-[250px] w-full">
                        {logs[service.name]?.flatMap((logPayload, i) => {
                            if (typeof logPayload !== 'string') return [];
                            return logPayload.split(/\r?\n/).filter(l => l.length > 0).map((line, j) => {
                                let className = 'text-green-400';
                                let content = line;
                                let prefix = null;
                                let prefixColor = '';

                                if (line.startsWith('[EVENT]')) className = 'text-blue-400 italic';
                                else if (line.startsWith('[SYS]')) className = 'text-gray-400';
                                else if (line.startsWith('[EXEC]')) className = 'text-yellow-400 font-bold bg-yellow-400/10 py-1 px-2 rounded my-1 border-l-2 border-yellow-400';
                                else {
                                    const match = line.match(/^([a-zA-Z0-9_-]+)(\s+\|\s?)(.*)/);
                                    if (match) {
                                        const serviceName = match[1];
                                        content = match[3];
                                        const colors = ['text-pink-400', 'text-indigo-400', 'text-teal-400', 'text-cyan-400', 'text-fuchsia-400', 'text-rose-400', 'text-violet-400', 'text-sky-400'];
                                        const hash = serviceName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                        prefixColor = colors[hash % colors.length];
                                        prefix = serviceName + match[2];
                                    }
                                }

                                return (
                                    <div key={`${i}-${j}`} className={`whitespace-pre-wrap leading-relaxed ${className}`}>
                                        {prefix && <span className={`${prefixColor} font-bold mr-1`}>{prefix}</span>}
                                        {content}
                                    </div>
                                );
                            });
                        }) || <span className="text-muted-foreground italic">No logs...</span>}
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
    const { runTour, tourSteps, startPageTour, handleJoyrideCallback, stepIndex } = useTour();
    const {
        socket,
        isConnected,
        setPendingPull,
        updateDialogOpen,
        setUpdateDialogOpen,
        pendingUpdateService,
        setPendingUpdateService,
        composeFileChanged,
        resetComposeFileChanged,
        logs,
        setLogs,
        globalLogs,
        setGlobalLogs
    } = useSocket();
    const [services, setServices] = useState([]);
    const [isGlobalLogsOpen, setIsGlobalLogsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        startPageTour('Settings', settingsSteps);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleOutput = ({ service, data, type }) => {
            const rawData = data || '';
            let formattedLog = rawData;

            if (type === 'exit') {
                formattedLog = `[SYS] Process exited`;
            } else if (type === 'info') {
                formattedLog = `[EXEC] ${rawData}`;
            } else if (type === 'event') {
                formattedLog = `[EVENT] ${rawData}`;
            }

            if (service) {
                setLogs(prev => ({
                    ...prev,
                    [service]: [...(prev[service] || []).slice(-99), formattedLog]
                }));
            } else {
                setGlobalLogs(prev => [...prev.slice(-49), formattedLog]);
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
    }, [socket, setLogs, setGlobalLogs]);

    const handleAction = (service, action) => {
        if (socket && isConnected) {
            if (action === 'pull') {
                setPendingPull(service);
            }

            const marker = `EXECUTING ACTION: [${action.toUpperCase()}] on ${service}`;
            setLogs(prev => ({
                ...prev,
                [service]: [...(prev[service] || []).slice(-99)]
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
    const allRunning = services.length > 0 && services.every(s => s.status === 'running');
    const anyStopped = services.some(s => s.status !== 'running' && s.status !== 'uncreated');

    const renderDynamicGlobalControls = () => {
        // We show Compose Up prominently if everything is uncreated OR if the compose file has changed
        const showProminentUp = allUncreated || composeFileChanged;

        return (
            <>
                {showProminentUp && (
                    <ConfirmButton
                        actionName="Initialize System (Up)"
                        description="This will start all services defined in docker-compose.yaml. It may recreate containers if configuration has changed. Existing data in non-persistent volumes might be reset."
                        onConfirm={() => {
                            handleGlobalAction('up');
                            resetComposeFileChanged(); // Reset the warning once they commit
                        }}
                        disabled={!isConnected}
                        variant={showProminentUp ? "default" : "ghost"}
                        className={`cursor-pointer h-9 px-4 text-sm font-medium transition-all rounded-md ${showProminentUp ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-sm' : 'hover:bg-muted-foreground/10 hover:text-foreground'}`}
                    >
                        <Play className={`h-4 w-4 mr-2 ${showProminentUp ? '' : 'text-muted-foreground'}`} /> {composeFileChanged ? 'Apply Changes (Up)' : 'Initialize System (Up)'}
                    </ConfirmButton>
                )}

                {(!allRunning && !allUncreated) && (
                    <ConfirmButton
                        actionName="Start All"
                        description="This will start existing stopped containers. Note: Services will boot up with their default JSON mock data."
                        onConfirm={() => handleGlobalAction('start')}
                        variant={anyStopped ? "default" : "ghost"}
                        disabled={!isConnected || allUncreated}
                        className={`cursor-pointer h-9 px-4 text-sm font-medium transition-all shadow-sm rounded-md ${anyStopped ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-transparent' : 'hover:bg-muted-foreground/10 hover:text-foreground'}`}
                    >
                        <Play className={`h-4 w-4 mr-2 ${anyStopped ? '' : 'text-muted-foreground'}`} /> Start All Services
                    </ConfirmButton>
                )}

                {anyRunning && (
                    <ConfirmButton
                        actionName="Stop All"
                        description={
                            <span>
                                This will stop all running containers.
                                <strong className="text-lg text-red-500">Warning: Any in-memory mock JSON changes will be lost.</strong>
                            </span>
                        }
                        onConfirm={() => handleGlobalAction('stop')}
                        variant={allRunning ? "destructive" : "ghost"}
                        disabled={!isConnected || !anyRunning}
                        className={`cursor-pointer h-9 px-4 text-sm font-medium transition-all rounded-md ${allRunning ? 'shadow-sm bg-yellow-600/90 hover:bg-yellow-600 text-white' : 'hover:bg-muted-foreground/10 hover:text-foreground'}`}
                    >
                        <Square className={`h-4 w-4 mr-2 ${allRunning ? '' : 'text-muted-foreground'}`} /> Stop All Services
                    </ConfirmButton>
                )}

                {!allUncreated && (
                    <div className="w-px h-6 bg-border mx-1" />
                )}

                {!allUncreated && (
                    <ConfirmButton
                        actionName="Destroy System (Down)"
                        description={
                            <span>
                                <strong className="text-lg text-red-500">WARNING:</strong> This will stop and REMOVE all containers and networks. Any data not stored in persistent volumes will be PERMANENTLY LOST.
                            </span>
                        }
                        onConfirm={() => handleGlobalAction('down')}
                        variant="destructive"
                        disabled={!isConnected}
                        validationKey="I agree to Destroy System"
                        className="cursor-pointer h-9 px-4 text-sm font-medium hover:bg-destructive/90 transition-all shadow-sm rounded-md"
                    >
                        <Square className="h-4 w-4 mr-2" /> Destroy System (Down)
                    </ConfirmButton>
                )}
            </>
        );
    };

    return (
        <div className="space-y-6 pb-12">
            <Joyride
                steps={tourSteps}
                run={runTour}
                stepIndex={stepIndex}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#3b82f6',
                        zIndex: 1000,
                    }
                }}
            />
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

            {/* Docker Compose Changed Banner */}
            {(isConnected && composeFileChanged) && (
                <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800 animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="font-semibold text-emerald-700 dark:text-emerald-300">Configuration Changes Detected</AlertTitle>
                    <AlertDescription className="mt-1">
                        The <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded text-xs">docker-compose.yaml</code> file has been modified.
                        Click <strong className="font-semibold px-1">Initialize System (Up)</strong> to safely apply these changes to the running stack.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex flex-col space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Global Controls
                        </CardTitle>
                        <CardDescription className="mt-1">Manage the entire application stack</CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-lg border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md joyride-global-actions">
                        {renderDynamicGlobalControls()}
                    </div>
                </CardHeader>
            </Card>

            <div className="flex justify-end">
                <Drawer open={isGlobalLogsOpen} onOpenChange={setIsGlobalLogsOpen}>
                    <DrawerTrigger asChild>
                        <Button variant="default" size="sm" className="cursor-pointer bg-green-600 hover:bg-green-700 text-white shadow-md joyride-logs-viewer">
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
                                            globalLogs.flatMap((logPayload, i) => {
                                                if (typeof logPayload !== 'string') return [];
                                                return logPayload.split(/\r?\n/).filter(l => l.length > 0).map((line, j) => {
                                                    let className = 'text-emerald-400';
                                                    let content = line;
                                                    let prefix = null;
                                                    let prefixColor = '';

                                                    if (line.startsWith('[EVENT]')) className = 'text-blue-400 italic';
                                                    else if (line.startsWith('[SYS]')) className = 'text-gray-400';
                                                    else if (line.startsWith('EXECUTING GLOBAL SYSTEM ACTION')) className = 'text-blue-400 font-bold bg-blue-400/10 py-1 px-2 rounded my-2 border-l-2 border-blue-400';
                                                    else if (line.startsWith('[EXEC]')) className = 'text-yellow-400 font-bold bg-yellow-400/10 py-1 px-2 rounded my-1 border-l-2 border-yellow-400';
                                                    else {
                                                        const match = line.match(/^([a-zA-Z0-9_-]+)(\s+\|\s?)(.*)/);
                                                        if (match) {
                                                            const serviceName = match[1];
                                                            content = match[3];
                                                            const colors = ['text-pink-400', 'text-indigo-400', 'text-teal-400', 'text-cyan-400', 'text-fuchsia-400', 'text-rose-400', 'text-violet-400', 'text-sky-400'];
                                                            const hash = serviceName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                                            prefixColor = colors[hash % colors.length];
                                                            prefix = serviceName + match[2];
                                                        }
                                                    }

                                                    return (
                                                        <div key={`${i}-${j}`} className={`whitespace-pre-wrap leading-relaxed ${className}`}>
                                                            {prefix && <span className={`${prefixColor} font-bold mr-1`}>{prefix}</span>}
                                                            {content}
                                                        </div>
                                                    );
                                                });
                                            })
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
                                <Button
                                    variant="outline"
                                    className="cursor-pointer hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 text-red-500 border-border"
                                    onClick={() => setGlobalLogs([])}
                                    disabled={globalLogs.length === 0}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Clear Logs
                                </Button>
                                <DrawerClose asChild>
                                    <Button variant="outline" className="cursor-pointer">Close Logs</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">Service Configuration</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search services..."
                                className="pl-8 h-9 w-[200px] lg:w-[300px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {isLoading && (
                            <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Fetching...
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
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
                        filteredServices.map(service => (
                            <CollapsibleServiceRow
                                key={service.name}
                                service={service}
                                socket={socket}
                                logs={logs}
                                setLogs={setLogs}
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

                    {!isLoading && services.length > 0 && filteredServices.length === 0 && !error && (
                        <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
                            No services match your search inquiry.
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
        </div >
    );
}
