import React, { useState, useEffect } from 'react';
import { Terminal, Send, CheckCircle2, AlertCircle, Info, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';

const EVENT_GROUPS = {
    "Flight & Route": [
        "FLTDATA_FLIGHT_NUMBER", "FLTDATA_AIRBUS_AIRCRAFT_ID",
        "FLTDATA_DEPARTURE_ID", "FLTDATA_DESTINATION_ID",
        "FLTDATA_DESTINATION_BAGGAGE_ID"
    ],
    "Navigation & Weather": [
        "FLTDATA_ALTITUDE", "FLTDATA_PRESENT_POSITION_LATITUDE", "FLTDATA_PRESENT_POSITION_LONGITUDE",
        "FLTDATA_DEPARTURE_LATITUDE", "DEST_CITY_TEMP"
    ],
    "Time & Progress": [
        "FLTDATA_DATE", "FLTDATA_DAY_OF_WEEK", "FLTDATA_GMT", "FLTDATA_ESTIMATED_ARRIVAL_TIME",
        "FLTDATA_TIME_AT_ORIGIN", "FLTDATA_TIME_AT_TAKEOFF",
        "FLTDATA_TIME_SINCE_TAKEOFF", "FLTDATA_TIME_TO_DESTINATION",
        "FLTDATA_DISTANCE_FROM_ORIGIN", "FLTDATA_DISTANCE_TO_DESTINATION",
        "FLTDATA_DISTANCE_TRAVELED"
    ],
    "Hardware & Devices": [
        "BRIGHTNESS_CHANGE"
    ]
};

// Maps specific events to explicitly labeled boolean-style GUI presets
const QUICK_ACTIONS = {
    "OPEN_FLIGHT": [
        { label: "Open Flight", value: "[1]" },
        { label: "Close Flight", value: "[0]" }
    ],
    "BLUETOOTH_CONTROL": [
        { label: "Enable", value: "[1]" },
        { label: "Disable", value: "[0]" }
    ],
    "CAPSENSE_STATE": [
        { label: "Capsense ON", value: "[1]" },
        { label: "Capsense OFF", value: "[0]" }
    ]
};

const CrewTerminalPage = () => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [customParamParams, setCustomParams] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [clientsConnected, setClientsConnected] = useState(0);
    const [isFlightOpen, setIsFlightOpen] = useState(false);
    const [defaultParamsMapping, setDefaultParamsMapping] = useState({});
    const [serverLogs, setServerLogs] = useState('');
    const [fetchingLogs, setFetchingLogs] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    // Compute active global filtered results
    const allEvents = Object.values(EVENT_GROUPS).flat();
    const filteredEvents = searchQuery
        ? allEvents.filter(evt => evt.toLowerCase().includes(searchQuery.toLowerCase()) || evt.replace("FLTDATA_", "").toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    useEffect(() => {
        let isMounted = true;

        const fetchStatus = async () => {
            try {
                const baseUrl = `http://${window.location.hostname}:50603`;
                const response = await fetch(`${baseUrl}/api/status`);
                const data = await response.json();
                if (isMounted) {
                    if (data.clientsConnected !== undefined) {
                        setClientsConnected(data.clientsConnected);
                    }
                    if (data.isFlightOpen !== undefined) {
                        setIsFlightOpen(data.isFlightOpen);
                    }
                }
            } catch (error) {
                // Silently ignore polling errors
            }
        };

        const fetchDefaults = async () => {
            try {
                const baseUrl = `http://${window.location.hostname}:50603`;
                const response = await fetch(`${baseUrl}/api/defaults`);
                const data = await response.json();
                if (isMounted && data) {
                    setDefaultParamsMapping(data);
                }
            } catch (error) {
                console.error("Could not fetch defaults:", error);
            }
        };

        fetchDefaults();
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const fetchServerLogs = async () => {
        setFetchingLogs(true);
        try {
            const baseUrl = `http://${window.location.hostname}:50603`;
            const response = await fetch(`${baseUrl}/api/logs`);
            const data = await response.json();
            setServerLogs(data.logs || 'No logs available');
        } catch (err) {
            setServerLogs('Error fetching logs: ' + err.message);
        } finally {
            setFetchingLogs(false);
        }
    };

    const handleFireEvent = async (eventName, useDefault = true, overridePayload = null) => {
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const body = { eventName };

            const payloadToParse = overridePayload !== null ? overridePayload : customParamParams;

            if (!useDefault && payloadToParse.trim() !== '') {
                // Try parsing user input array like [35000] or ["NZAA"]
                try {
                    const parsedArray = JSON.parse(payloadToParse);
                    if (!Array.isArray(parsedArray)) {
                        throw new Error("Parameters must be a valid JSON array.");
                    }
                    body.params = parsedArray;
                } catch (e) {
                    setStatus({ type: 'error', message: 'Invalid JSON Array format. Example: ["35000"] or [100, 200]' });
                    setLoading(false);
                    return;
                }
            }

            // Dynamically construct the base URL using the current window's hostname. 
            // In a Docker environment, 'localhost' might not be reachable from other machines on the network.
            const baseUrl = `http://${window.location.hostname}:50603`;

            const response = await fetch(`${baseUrl}/api/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: `Successfully fired: ${eventName}` });
                setTimeout(() => setStatus({ type: '', message: '' }), 4000);
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to trigger event' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Could not connect to PAC Server.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16 relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/40 pb-6 relative">
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center p-2 mb-4 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                        <Terminal className="h-8 w-8 animate-[pulse_4s_ease-in-out_infinite]" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                        Crew Terminal
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2 max-w-2xl font-light">
                        Simulate and trigger hardware & flight data events natively to connected clients via Websockets.
                    </p>
                </div>

                {/* Connected Clients & Actions Indicator */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:self-center relative group">
                    <Button
                        variant={showLogs ? "default" : "outline"}
                        onClick={() => {
                            if (!showLogs) fetchServerLogs();
                            setShowLogs(!showLogs);
                        }}
                        className={`h-9 px-4 text-sm font-semibold rounded-xl border shadow-sm transition-all duration-300 ${showLogs ? 'bg-primary text-primary-foreground border-primary shadow-primary/25' : 'bg-background/80 backdrop-blur-xl border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/40'}`}
                    >
                        <Terminal className="w-4 h-4 mr-2" />
                        {showLogs ? "Close Logs" : "Server Logs"}
                    </Button>

                    <div className="relative group/badge">
                        <div className={`absolute -inset-0.5 rounded-full blur opacity-40 group-hover/badge:opacity-60 transition ${clientsConnected > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <Badge variant="outline" className="relative px-4 py-2 flex items-center gap-2.5 text-sm bg-background/80 backdrop-blur-xl border-border/50 shadow-sm leading-none">
                            <span className="relative flex h-3 w-3 items-center justify-center">
                                {clientsConnected > 0 && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${clientsConnected > 0 ? 'bg-emerald-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></span>
                            </span>
                            <span className={`font-semibold tracking-wide uppercase text-xs ${clientsConnected > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                {clientsConnected} Client{clientsConnected !== 1 ? 's' : ''} Connected
                            </span>
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Status Alert Banner */}
            {status.message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 border transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            {/* Prominent Quick Controls */}
            <Card className="border-primary/20 shadow-xl bg-gradient-to-r from-primary/5 via-background to-background mb-8 overflow-hidden relative group">
                {/* Animated shimmer line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/40 via-primary to-primary/40"></div>

                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2.5 tracking-tight">
                                Flight Operations
                                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-2 text-[10px]">QUICK CONTROL</Badge>
                                <Badge variant="outline" className={`ml-2 px-2.5 py-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isFlightOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    <span className="relative flex h-2 w-2 items-center justify-center">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFlightOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isFlightOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                    </span>
                                    {isFlightOpen ? 'Flight Open' : 'Flight Closed'}
                                </Badge>
                            </h3>
                            <p className="text-base text-muted-foreground font-medium">
                                Instantly open or close the active flight session globally on the PAC Server.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                className="flex-1 md:flex-none border-emerald-500/40 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/15 hover:text-emerald-700 hover:border-emerald-500/60 dark:text-emerald-400 dark:hover:text-emerald-300 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 shadow-sm transition-all h-12 px-6 text-sm font-semibold rounded-xl"
                                onClick={() => handleFireEvent("OPEN_FLIGHT", false, "[1]")}
                                disabled={loading}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Open Flight
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 md:flex-none border-red-500/40 bg-red-500/5 text-red-600 hover:bg-red-500/15 hover:text-red-700 hover:border-red-500/60 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-950/30 dark:hover:bg-red-900/40 shadow-sm transition-all h-12 px-6 text-sm font-semibold rounded-xl"
                                onClick={() => handleFireEvent("OPEN_FLIGHT", false, "[0]")}
                                disabled={loading}
                            >
                                <AlertCircle className="mr-2 h-5 w-5" />
                                Close Flight
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="col-span-1 lg:col-span-2">
                    {/* Search Bar */}
                    <div className="mb-6 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                        <div className="relative flex items-center bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 transition-colors rounded-xl shadow-sm px-4 h-12">
                            <Search className="h-5 w-5 text-muted-foreground mr-3" />
                            <Input
                                placeholder="Search all payload modules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm font-medium"
                            />
                            {searchQuery && (
                                <Badge variant="secondary" className="ml-2 font-mono text-[10px] bg-primary/10 text-primary border-transparent">
                                    {filteredEvents.length} RESULTS
                                </Badge>
                            )}
                        </div>
                    </div>

                    {showLogs ? (
                        <Card className="border-border/40 shadow-2xl backdrop-blur-2xl bg-background/90 h-[480px] flex flex-col rounded-2xl overflow-hidden ring-1 ring-primary/20 dark:ring-primary/20 animate-in fade-in zoom-in-95 duration-300">
                            <CardHeader className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border/40 pb-5 shrink-0 px-6 pt-6 relative">
                                <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/20 scale-150 pattern-size-4 pointer-events-none opacity-50" />
                                <CardTitle className="text-xl flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/20 text-primary">
                                            <Terminal className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold tracking-tight">Server Telemetry Logs</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchServerLogs}
                                        disabled={fetchingLogs}
                                        className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary transition-colors rounded-lg px-4"
                                    >
                                        {fetchingLogs ? 'Refreshing...' : 'Refresh Logs'}
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden bg-black/5 dark:bg-black/40">
                                <ScrollArea className="h-full w-full p-0">
                                    <pre className="font-mono text-xs p-6 text-foreground/80 break-words whitespace-pre-wrap">
                                        {serverLogs || (fetchingLogs ? 'Fetching logs...' : 'No logs loaded. Click Refresh.')}
                                    </pre>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    ) : searchQuery ? (
                        <Card className="border-border/40 shadow-xl backdrop-blur-2xl bg-background/80 h-[480px] flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40 pb-5 shrink-0 px-6 pt-6">
                                <CardTitle className="text-xl flex items-center justify-between">
                                    <span className="font-semibold tracking-tight">Search Results</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <ScrollArea className="h-full w-full p-6">
                                    {filteredEvents.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 pb-6">
                                            {filteredEvents.map((evt) => (
                                                <Button
                                                    key={evt}
                                                    variant={"outline"}
                                                    className={`justify-start font-mono text-[11.5px] h-auto min-h-[52px] py-3 px-4 break-all whitespace-normal text-left transition-all duration-300 ${selectedEvent === evt
                                                        ? 'bg-primary border-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.3)] scale-[1.03] z-10'
                                                        : 'bg-background hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 text-foreground/80 hover:text-foreground'
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedEvent(evt);
                                                        if (defaultParamsMapping[evt]) {
                                                            setCustomParams(JSON.stringify(defaultParamsMapping[evt]));
                                                        } else {
                                                            setCustomParams('');
                                                        }
                                                    }}
                                                >
                                                    <span className="truncate w-full block">{evt.replace("FLTDATA_", "")}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                                            <Search className="h-10 w-10 mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No modules found matching "{searchQuery}"</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    ) : (
                        <Tabs defaultValue="Flight & Route" className="w-full">
                            <TabsList className="flex w-full overflow-x-auto h-auto p-1.5 mb-6 bg-muted/50 rounded-2xl shadow-inner border border-border/40">
                                {Object.keys(EVENT_GROUPS).map((groupName) => (
                                    <TabsTrigger
                                        key={groupName}
                                        value={groupName}
                                        className="px-4 py-2.5 text-sm font-medium rounded-xl flex-1 whitespace-nowrap transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent data-[state=active]:border-border/50"
                                    >
                                        {groupName}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {Object.entries(EVENT_GROUPS).map(([category, events]) => (
                                <TabsContent key={category} value={category} className="mt-0 outline-none focus-visible:ring-0">
                                    <Card className="border-border/40 shadow-xl backdrop-blur-2xl bg-background/80 h-[456px] flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5">
                                        <CardHeader className="bg-gradient-to-b from-muted/40 to-transparent border-b border-border/40 pb-5 shrink-0 px-6 pt-6">
                                            <CardTitle className="text-xl flex items-center justify-between">
                                                <span className="font-semibold tracking-tight">{category}</span>
                                                <Badge variant="secondary" className="font-mono bg-primary/15 text-primary border-primary/20 shadow-sm px-2.5 py-0.5 rounded-full">{events.length} Modules</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 flex-1 overflow-hidden">
                                            <ScrollArea className="h-full w-full p-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 pb-6">
                                                    {events.map((evt) => (
                                                        <Button
                                                            key={evt}
                                                            variant={"outline"}
                                                            className={`justify-start font-mono text-[11.5px] h-auto min-h-[52px] py-3 px-4 break-all whitespace-normal text-left transition-all duration-300 ${selectedEvent === evt
                                                                ? 'bg-primary border-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary),0.3)] scale-[1.03] z-10'
                                                                : 'bg-background hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 text-foreground/80 hover:text-foreground'
                                                                }`}
                                                            onClick={() => {
                                                                setSelectedEvent(evt);
                                                                if (defaultParamsMapping[evt]) {
                                                                    setCustomParams(JSON.stringify(defaultParamsMapping[evt]));
                                                                } else {
                                                                    setCustomParams('');
                                                                }
                                                            }}
                                                        >
                                                            <span className="truncate w-full block">{evt.replace("FLTDATA_", "")}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}
                </div>

                {/* Control Panel Sidebar */}
                <div className="col-span-1">
                    <div className="sticky top-6">
                        <Card className="border-border/40 shadow-xl backdrop-blur-3xl bg-background/60 h-[520px] flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5 relative group">
                            {/* Decorative dynamic glows */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-primary/30" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <CardHeader className="bg-gradient-to-b from-muted/30 to-transparent border-b border-border/40 pb-5 shrink-0 px-6 pt-6 relative z-10">
                                <CardTitle className="text-xl flex items-center gap-2.5 font-semibold tracking-tight">
                                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                        <Terminal className="h-4 w-4" />
                                    </div>
                                    Execution Deck
                                </CardTitle>
                                <CardDescription className="text-sm mt-1.5">
                                    {selectedEvent ? <span className="text-primary font-medium tracking-wide">{selectedEvent}</span> : 'Select an event from the library.'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-6 flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-10 space-y-6">
                                {selectedEvent ? (
                                    <>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-foreground/80 uppercase tracking-widest">
                                                    Custom Array Payload
                                                </label>
                                            </div>
                                            <div className="relative group/input">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-0 group-focus-within/input:opacity-100 transition duration-500"></div>
                                                <Input
                                                    placeholder='e.g., ["35000"] or [0, 40, 100]'
                                                    value={customParamParams}
                                                    onChange={(e) => setCustomParams(e.target.value)}
                                                    className="relative font-mono text-sm bg-background/90 border-border/50 shadow-inner focus-visible:ring-0 focus-visible:border-transparent rounded-lg h-11"
                                                />
                                            </div>

                                            <p className="text-[11px] leading-relaxed text-muted-foreground flex items-start gap-2 mt-2 bg-muted/40 p-3 rounded-lg border border-border/30">
                                                <Info className="min-w-3.5 h-3.5 mt-0.5 text-primary" />
                                                <span>Edit the array above to broadcast a custom payload. Clear the input entirely to fire the pre-seeded backend defaults.</span>
                                            </p>
                                        </div>

                                        {QUICK_ACTIONS[selectedEvent] && (
                                            <div className="space-y-3 pt-2">
                                                <label className="text-xs font-bold text-foreground/80 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Action Presets
                                                </label>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    {QUICK_ACTIONS[selectedEvent].map((action) => (
                                                        <Button
                                                            key={action.label}
                                                            variant="outline"
                                                            size="sm"
                                                            className={`text-xs h-9 rounded-lg transition-all ${customParamParams === action.value
                                                                ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary),0.15)] ring-1 ring-primary/30'
                                                                : 'hover:border-primary/40 hover:bg-background'}`}
                                                            onClick={() => setCustomParams(action.value)}
                                                        >
                                                            {action.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-auto pt-6 border-t border-border/30">
                                            <Button
                                                className="w-full relative overflow-hidden group shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all duration-300 h-12 rounded-xl border border-primary/20"
                                                size="lg"
                                                onClick={() => handleFireEvent(selectedEvent, customParamParams === '')}
                                                disabled={loading}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-blue-600 opacity-90" />
                                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                                                <span className="relative z-10 font-bold tracking-wide flex items-center text-white">
                                                    <Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                    {loading ? 'TRANSMITTING...' : 'TRANSMIT PAYLOAD'}
                                                </span>
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in duration-700">
                                        <div className="relative mb-6 group-hover:scale-110 transition-transform duration-500">
                                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 animate-pulse" />
                                            <div className="relative bg-background/80 p-5 rounded-2xl border border-border/50 shadow-xl backdrop-blur-sm">
                                                <Terminal className="h-10 w-10 text-primary/60" />
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-bold text-foreground mb-2">Awaiting Instructions</h4>
                                        <p className="text-sm text-muted-foreground/80 max-w-[200px] leading-relaxed">
                                            Select any module from the library to configure its payload bridging sequence.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div >
    );
};

export default CrewTerminalPage;
