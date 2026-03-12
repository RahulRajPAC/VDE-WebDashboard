import React, { useState, useEffect, useRef } from 'react';
import {
    Terminal, Send, CheckCircle2, AlertCircle, Info, Search,
    Headphones, Sun, Bluetooth, Volume2, Users, Clock,
    Activity, Cloud, Plane, MapPin, Gauge, CloudRain,
    ActivitySquare, MonitorPlay, Thermometer, Calendar, Compass, AlignLeft,
    PlayCircle
} from 'lucide-react';
import CrewHeader from './components/CrewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import useCrewTerminalStatus from './hooks/useCrewTerminalStatus';

import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

const EVENT_GROUPS = {
    "Flight": [
        "X2_PA_STATE", "FLTDATA_FLIGHT_NUMBER", "FLTDATA_AIRBUS_AIRCRAFT_CODE", "FLTDATA_AIRBUS_AIRCRAFT_ID",
        "FLTDATA_AIRBUS_FLEET_ID", "FLTDATA_LANGUAGE_ID"
    ],
    "Route": [
        "ROUTE_ID", "FLTDATA_DEPARTURE_ID", "FLTDATA_DESTINATION_ID",
        "FLTDATA_DEPARTURE_BAGGAGE_ID", "FLTDATA_DESTINATION_BAGGAGE_ID"
    ],
    "Navigation": [
        "FLTDATA_ALTITUDE", "FLTDATA_PRESENT_POSITION_LATITUDE", "FLTDATA_PRESENT_POSITION_LONGITUDE",
        "FLTDATA_DEPARTURE_LATITUDE", "FLTDATA_DEPARTURE_LONGITUDE", "FLTDATA_DESTINATION_LATITUDE",
        "FLTDATA_DESTINATION_LONGITUDE", "FLTDATA_GROUND_SPEED",
        "FLTDATA_MACH", "FLTDATA_TRUE_AIR_SPEED", "FLTDATA_TRUE_HEADING"
    ],
    "Weather": [
        "FLTDATA_HEAD_WIND_SPEED", "FLTDATA_OUTSIDE_AIR_TEMP",
        "FLTDATA_WIND_DIRECTION", "FLTDATA_WIND_SPEED", "DEST_CITY_TEMP", "DEST_CITY_WEATHER_ID"
    ],
    "Time & Progress": [
        "FLTDATA_DATE", "FLTDATA_DAY_OF_WEEK", "FLTDATA_GMT", "FLTDATA_ESTIMATED_ARRIVAL_TIME",
        "FLTDATA_TIME_AT_DESTINATION", "FLTDATA_TIME_AT_ORIGIN", "FLTDATA_TIME_AT_TAKEOFF",
        "FLTDATA_TIME_SINCE_TAKEOFF", "FLTDATA_TIME_TO_DESTINATION", "FLTDATA_TIME_TO_TOP_OF_DESCENT",
        "FLTDATA_DISTANCE_FROM_ORIGIN", "FLTDATA_DISTANCE_TO_DESTINATION",
        "FLTDATA_DISTANCE_TO_DESTINATION_AT_TAKEOFF", "FLTDATA_DISTANCE_TRAVELED"
    ],
    "Hardware & Devices": [
        "AUDIO_DEVICE_ADDED", "AUDIO_DEVICE_REMOVED", "BRIGHTNESS_CHANGE",
        "BLUETOOTH_CONTROL", "CAPSENSE_STATE", "MEDIA_DATE", "VOLUME_CHANGE", "ENTERTAINMENT_ON",
    ]
};

// New mapping object for friendly UI rendering of events
const EVENT_METADATA = {
    // Hardware & Devices
    "AUDIO_DEVICE_ADDED": { title: "AUDIO DEVICE ADDED", subtitle: "Simulate device connect", Icon: Headphones },
    "AUDIO_DEVICE_REMOVED": { title: "AUDIO DEVICE REMOVED", subtitle: "Simulate device disconnect", Icon: Headphones },
    "BRIGHTNESS_CHANGE": { title: "BRIGHTNESS CHANGE", subtitle: "Adjust screen brightness", Icon: Sun },
    "BLUETOOTH_CONTROL": { title: "BLUETOOTH CONTROL", subtitle: "Simulate Bluetooth state change", Icon: Bluetooth },
    "VOLUME_CHANGE": { title: "VOLUME CHANGE", subtitle: "Adjust audio volume", Icon: Volume2 },
    "CAPSENSE_STATE": { title: "CAPSENSE STATE", subtitle: "Toggle capacitive buttons", Icon: ActivitySquare },
    "ENTERTAINMENT_ON": { title: "ENTERTAINMENT", subtitle: "Toggle IFE Screen Status", Icon: MonitorPlay },
    "MEDIA_DATE": { title: "MEDIA DATE", subtitle: "Set media playback date", Icon: Calendar },

    // Flight & Route
    "X2_PA_STATE": { title: "PASSENGER ANNOUNCEMENT", subtitle: "Triggers passenger announcement", Icon: Users },
    "FLTDATA_FLIGHT_NUMBER": { title: "FLIGHT NUMBER", subtitle: "Update active flight number", Icon: Plane },
    "FLTDATA_AIRBUS_AIRCRAFT_CODE": { title: "AIRBUS AIRCRAFT CODE", subtitle: "Set aircraft code", Icon: Plane },
    "FLTDATA_AIRBUS_AIRCRAFT_ID": { title: "AIRBUS AIRCRAFT ID", subtitle: "Set aircraft ID", Icon: Plane },
    "FLTDATA_AIRBUS_FLEET_ID": { title: "AIRBUS FLEET ID", subtitle: "Set fleet ID", Icon: Users },
    "FLTDATA_LANGUAGE_ID": { title: "LANGUAGE ID", subtitle: "Set active language", Icon: AlignLeft },
    "ROUTE_ID": { title: "ROUTE ID", subtitle: "Update current route", Icon: MapPin },
    "FLTDATA_DEPARTURE_ID": { title: "DEPARTURE ID", subtitle: "Set departure airport code", Icon: Plane },
    "FLTDATA_DESTINATION_ID": { title: "DESTINATION ID", subtitle: "Set destination airport code", Icon: Plane },
    "FLTDATA_DEPARTURE_BAGGAGE_ID": { title: "DEPARTURE BAGGAGE ID", subtitle: "Set departure baggage ID", Icon: Plane },
    "FLTDATA_DESTINATION_BAGGAGE_ID": { title: "DESTINATION BAGGAGE ID", subtitle: "Set destination baggage ID", Icon: Plane },

    // Navigation & Weather
    "FLTDATA_ALTITUDE": { title: "ALTITUDE", subtitle: "Update altitude", Icon: Activity },
    "FLTDATA_PRESENT_POSITION_LATITUDE": { title: "PRESENT POSITION LATITUDE", subtitle: "Update latitude", Icon: MapPin },
    "FLTDATA_PRESENT_POSITION_LONGITUDE": { title: "PRESENT POSITION LONGITUDE", subtitle: "Update longitude", Icon: MapPin },
    "FLTDATA_DEPARTURE_LATITUDE": { title: "DEPARTURE LATITUDE", subtitle: "Set departure latitude", Icon: MapPin },
    "FLTDATA_DEPARTURE_LONGITUDE": { title: "DEPARTURE LONGITUDE", subtitle: "Set departure longitude", Icon: MapPin },
    "FLTDATA_DESTINATION_LATITUDE": { title: "DESTINATION LATITUDE", subtitle: "Set destination latitude", Icon: MapPin },
    "FLTDATA_DESTINATION_LONGITUDE": { title: "DESTINATION LONGITUDE", subtitle: "Set destination longitude", Icon: MapPin },
    "FLTDATA_GROUND_SPEED": { title: "GROUND SPEED", subtitle: "Update ground speed", Icon: Gauge },
    "FLTDATA_HEAD_WIND_SPEED": { title: "HEAD WIND SPEED", subtitle: "Update head wind speed", Icon: CloudRain },
    "FLTDATA_MACH": { title: "MACH SPEED", subtitle: "Update mach speed", Icon: Gauge },
    "FLTDATA_OUTSIDE_AIR_TEMP": { title: "OUTSIDE AIR TEMP", subtitle: "Update outside air temp", Icon: Thermometer },
    "FLTDATA_TRUE_AIR_SPEED": { title: "TRUE AIR SPEED", subtitle: "Update true air speed", Icon: Gauge },
    "FLTDATA_TRUE_HEADING": { title: "TRUE HEADING", subtitle: "Update true heading", Icon: Compass },
    "FLTDATA_WIND_DIRECTION": { title: "WIND DIRECTION", subtitle: "Update wind direction", Icon: Compass },
    "FLTDATA_WIND_SPEED": { title: "WIND SPEED", subtitle: "Update wind speed", Icon: CloudRain },
    "DEST_CITY_TEMP": { title: "DEST CITY TEMP", subtitle: "Set destination city temp", Icon: Thermometer },
    "DEST_CITY_WEATHER_ID": { title: "DEST CITY WEATHER ID", subtitle: "Set destination weather ID", Icon: Cloud },

    // Time & Progress
    "FLTDATA_DATE": { title: "DATE", subtitle: "Update current date", Icon: Calendar },
    "FLTDATA_DAY_OF_WEEK": { title: "DAY OF WEEK", subtitle: "Update day of week", Icon: Calendar },
    "FLTDATA_GMT": { title: "GMT", subtitle: "Update GMT time", Icon: Clock },
    "FLTDATA_ESTIMATED_ARRIVAL_TIME": { title: "ETA", subtitle: "Update estimated arrival", Icon: Clock },
    "FLTDATA_TIME_AT_DESTINATION": { title: "TIME AT DESTINATION", subtitle: "Update time at destination", Icon: Clock },
    "FLTDATA_TIME_AT_ORIGIN": { title: "TIME AT ORIGIN", subtitle: "Update time at origin", Icon: Clock },
    "FLTDATA_TIME_AT_TAKEOFF": { title: "TIME AT TAKEOFF", subtitle: "Update time at takeoff", Icon: Clock },
    "FLTDATA_TIME_SINCE_TAKEOFF": { title: "TIME SINCE TAKEOFF", subtitle: "Update time elapsed", Icon: Clock },
    "FLTDATA_TIME_TO_DESTINATION": { title: "TIME TO DESTINATION", subtitle: "Update time remaining", Icon: Clock },
    "FLTDATA_TIME_TO_TOP_OF_DESCENT": { title: "TIME TO DESCENT", subtitle: "Update time to descent", Icon: Clock },
    "FLTDATA_DISTANCE_FROM_ORIGIN": { title: "DISTANCE FROM ORIGIN", subtitle: "Update distance traveled", Icon: Activity },
    "FLTDATA_DISTANCE_TO_DESTINATION": { title: "DISTANCE TO DESTINATION", subtitle: "Update distance remaining", Icon: Activity },
    "FLTDATA_DISTANCE_TO_DESTINATION_AT_TAKEOFF": { title: "DISTANCE TO DESTINATION AT TAKEOFF", subtitle: "Update total distance", Icon: Activity },
    "FLTDATA_DISTANCE_TRAVELED": { title: "DISTANCE TRAVELED", subtitle: "Update distance traveled", Icon: Activity }
};

const SIDEBAR_CATEGORIES = [
    { name: "Flight", icon: Plane, group: "Flight" },
    { name: "Route", icon: MapPin, group: "Route" },
    { name: "Navigation", icon: Compass, group: "Navigation" },
    { name: "Weather", icon: Cloud, group: "Weather" },
    { name: "Time", icon: Clock, group: "Time & Progress" },
    { name: "Hardware", icon: Headphones, group: "Hardware & Devices" }
];


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
    ],
    "ENTERTAINMENT_ON": [
        { label: "Enable", value: "[1]" },
        { label: "Disable", value: "[0]" }
    ],
    "X2_PA_STATE": [
        { label: "PA ON", value: "[1]" },
    ]
};

const CrewTerminalPage = () => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [customParamParams, setCustomParams] = useState('');
    const [loading, setLoading] = useState(false);
    const [isIFEOn, setIsIFEOn] = useState(false);

    const {
        clientsConnected,
        isFlightOpen,
        setIsFlightOpen,
        serverLogs,
        fetchingLogs,
        showLogs,
        setShowLogs,
        fetchServerLogs
    } = useCrewTerminalStatus();

    const [defaultParamsMapping, setDefaultParamsMapping] = useState({});
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchFocused, setSearchFocused] = useState(false);
    const gridScrollRef = useRef(null);
    const searchInputRef = useRef(null);

    // Color palette per category group
    const CATEGORY_COLORS = {
        "Hardware & Devices": { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', header: 'bg-violet-600' },
        "Navigation": { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', header: 'bg-blue-600' },
        "Weather": { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', badge: 'bg-teal-100 text-teal-700', header: 'bg-teal-600' },
        "Flight": { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', header: 'bg-emerald-600' },
        "Route": { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', header: 'bg-sky-600' },
        "Time & Progress": { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', header: 'bg-amber-600' },
    };

    // Robust multi-field search: matches raw key, stripped key, friendly title, and subtitle.
    // Query is split into tokens — every token must match at least one field (AND logic per token).
    const allEvents = Object.values(EVENT_GROUPS).flat();
    const filteredEvents = searchQuery.trim()
        ? (() => {
            const tokens = searchQuery.trim().toLowerCase().split(/\s+/);
            return allEvents.filter(evt => {
                const meta = EVENT_METADATA[evt];
                const haystack = [
                    evt.toLowerCase(),                                          // raw key: X2_PA_STATE
                    evt.replace(/_/g, ' ').toLowerCase(),                       // spaced key: X2 PA STATE
                    evt.replace('FLTDATA_', '').replace(/_/g, ' ').toLowerCase(),// stripped: FLIGHT NUMBER
                    meta?.title?.toLowerCase() ?? '',                           // friendly title: PASSENGER ANNOUNCEMENT
                    meta?.subtitle?.toLowerCase() ?? '',                        // subtitle: triggers passenger announcement
                ].join(' ');
                return tokens.every(token => haystack.includes(token));
            });
        })()
        : [];

    useEffect(() => {
        let isMounted = true;

        const fetchDefaults = async () => {
            try {
                const baseUrl = `http://${window.location.hostname}:50603`;
                const response = await fetch(`${baseUrl}/api/defaults`);
                const data = await response.json();
                if (isMounted && data) {
                    setDefaultParamsMapping(data);
                }
            } catch (ignored) {
                console.error("Could not fetch defaults:", ignored);
            }
        };

        fetchDefaults();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleFireEvent = async (eventName, useDefault = true, overridePayload = null, silent = false) => {
        setLoading(true);

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
                } catch {
                    if (!silent) toast.error('Invalid JSON Array format. Example: ["35000"] or [100, 200]');
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

            const resultMessage = response.ok ? `Successfully fired: ${eventName}` : (data.error || `Failed to trigger event: ${eventName}`);
            if (response.ok) {
                if (!silent) {
                    toast.success(resultMessage);
                }
                return { ok: true, message: resultMessage };
            } else {
                if (!silent) toast.error(resultMessage);
                return { ok: false, message: resultMessage };
            }
        } catch {
            const errMsg = 'Could not connect to PAC Server.';
            if (!silent) toast.error(errMsg);
            return { ok: false, message: errMsg };
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden font-sans text-slate-800 dark:text-slate-100">


            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">

                <CrewHeader
                    title="PACIO Events"
                    subtitle="Trigger PACIO events for system simulation and testing."
                    isFlightOpen={isFlightOpen}
                    clientsConnected={clientsConnected}
                    showLogs={showLogs}
                    setShowLogs={setShowLogs}
                    fetchServerLogs={fetchServerLogs}
                    fetchingLogs={fetchingLogs}
                    serverLogs={serverLogs}
                />
                {/* Quick Controls — always visible, directly below header */}
                <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-700/60 px-6 py-3 flex gap-4">
                    {/* Flight Operations */}
                    <div className="flex-1 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Plane className={`w-4 h-4 ${isFlightOpen ? 'text-emerald-500' : 'text-red-400'}`} />
                            <div>
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Flight Status</p>
                                <p className="text-[11px] text-slate-400 font-medium">Open or close the active flight</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isFlightOpen ? (
                                <button
                                    onClick={async () => {
                                        const res1 = await handleFireEvent("OPEN_FLIGHT", false, "[0]");
                                        if (res1 && res1.ok) {
                                            setIsFlightOpen(false);
                                        }
                                        const messages = [];
                                        if (res1) messages.push(res1.message);

                                        // if entertainment (IFE) is on, turn it off silently but include its message
                                        let res2;
                                        if (isIFEOn) {
                                            res2 = await handleFireEvent("ENTERTAINMENT_ON", false, "[0]", true);
                                            if (res2 && res2.ok) setIsIFEOn(false);
                                            if (res2) messages.push(res2.message);
                                        }

                                        // show combined result(s)
                                        if (messages.length > 0) {
                                            const combined = messages.join(' | ');
                                            // Determine overall type: success if all ok
                                            const allOk = (res1 ? res1.ok : false) && (isIFEOn ? (res2 ? res2.ok : false) : true);
                                            if (allOk) {
                                                toast.success(combined);
                                            } else {
                                                toast.error(combined);
                                            }
                                        }
                                    }}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-[12px] font-bold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <AlertCircle className="w-3 h-3" /> Close Flight
                                </button>
                            ) : (
                                <p className="text-[11px] text-slate-400 font-medium">Please <b className="text-emerald-500 font-bold">Open Flight</b> to view and trigger events.</p>
                            )}
                        </div>
                    </div>

                    {/* Entertainment System */}
                    {isFlightOpen ? (<div className="flex-1 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Headphones className={`w-4 h-4 ${isIFEOn ? 'text-emerald-500' : 'text-red-400'}`} />
                            <div>
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Entertainment</p>
                                <p className="text-[11px] text-slate-400 font-medium">Turn Entertainment on or off</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isIFEOn ? (
                                <button
                                    onClick={async () => { await handleFireEvent("ENTERTAINMENT_ON", false, "[0]"); setIsIFEOn(false); }}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-[12px] font-bold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <AlertCircle className="w-3 h-3" /> Turn OFF
                                </button>
                            ) : (
                                <button
                                    onClick={async () => { await handleFireEvent("ENTERTAINMENT_ON", false, "[1]"); setIsIFEOn(true); }}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[12px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Turn ON
                                </button>
                            )}
                        </div>
                    </div>) : (
                        <div className="flex items-center gap-3">
                            <Headphones className="w-4 h-4 text-blue-500" />
                            <div>
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Entertainment System</p>
                                <p className="text-[11px] text-slate-400 font-medium">Please <b className="text-emerald-500 font-bold">Open Flight</b> for Entertainment System </p>
                            </div>
                        </div>
                    )}
                    {/* Passenger Announcement
                    {isFlightOpen ? (<div className="flex-1 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 ">
                        <div className="flex items-center gap-3">
                            <Users className={`w-4 h-4 ${isPAOn ? 'text-emerald-500' : 'text-red-400'}`}  />
                            <div>
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Passenger Announcement</p>
                                <p className="text-[11px] text-slate-400 font-medium">Broadcast announcements to seat</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isPAOn ? (
                                <button
                                    onClick={async () => { await handleFireEvent("X2_PA_STATE", false, "[0]"); setIsPAOn(false); }}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-[12px] font-bold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <AlertCircle className="w-3 h-3" /> Turn OFF
                                </button>
                            ) : (
                                <button
                                    onClick={async () => { await handleFireEvent("X2_PA_STATE", false, "[1]"); setIsPAOn(true); }}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[12px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Turn ON
                                </button>
                            )}
                        </div>
                    </div>) : (
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-blue-500" />
                            <div>
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Passenger Announcement</p>
                                <p className="text-[11px] text-slate-400 font-medium">Please <b className="text-emerald-500 font-bold">Open Flight</b> for Passenger Announcement </p>
                            </div>
                        </div>
                    )} */}


                </div>

                {/* Category Nav + Search — bold, tall, distinctive horizontal nav */}
                {isFlightOpen ?
                    (
                        <>
                            {/* ══ Category Nav Bar ══ */}
                            <div className="shrink-0 border-b border-slate-200 dark:border-slate-700/80 flex items-stretch gap-0 px-4 h-[76px] relative rounded-md"
                                style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

                                {/* Left: Category Card Tabs — hidden when search is focused */}
                                <div
                                    className="flex items-stretch gap-2 overflow-x-auto hide-scrollbar min-w-0 py-3 pr-4 transition-all duration-300"
                                    style={{
                                        flex: searchFocused ? '0 0 0px' : '1 1 0px',
                                        opacity: searchFocused ? 0 : 1,
                                        pointerEvents: searchFocused ? 'none' : 'auto',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {SIDEBAR_CATEGORIES.map((category, idx) => {
                                        const groupEvents = EVENT_GROUPS[category.group] || [];
                                        const isActive = selectedCategory !== null
                                            ? selectedCategory === category.name
                                            : groupEvents.includes(selectedEvent);

                                        // Per-category accent config
                                        const ACCENT = [
                                            { border: '#3b82f6', glow: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.15)', iconColor: '#93c5fd', labelColor: '#bfdbfe', badgeBg: '#1d4ed8', activeLabelColor: '#fff' },
                                            { border: '#10b981', glow: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.15)', iconColor: '#6ee7b7', labelColor: '#a7f3d0', badgeBg: '#065f46', activeLabelColor: '#fff' },
                                            { border: '#14b8a6', glow: 'rgba(20,184,166,0.35)', bg: 'rgba(20,184,166,0.15)', iconColor: '#5eead4', labelColor: '#99f6e4', badgeBg: '#0f766e', activeLabelColor: '#fff' },
                                            { border: '#f59e0b', glow: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.15)', iconColor: '#fcd34d', labelColor: '#fde68a', badgeBg: '#92400e', activeLabelColor: '#fff' },
                                            { border: '#8b5cf6', glow: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.15)', iconColor: '#c4b5fd', labelColor: '#ddd6fe', badgeBg: '#4c1d95', activeLabelColor: '#fff' },
                                        ][idx % 5];

                                        return (
                                            <button
                                                key={category.name}
                                                onClick={() => {
                                                    setSelectedCategory(category.name);
                                                    const el = document.getElementById(`group-${category.group}`);
                                                    if (el && gridScrollRef.current) {
                                                        const containerTop = gridScrollRef.current.getBoundingClientRect().top;
                                                        const elTop = el.getBoundingClientRect().top;
                                                        gridScrollRef.current.scrollTop += (elTop - containerTop) - 16;
                                                    }
                                                }}
                                                style={isActive ? {
                                                    background: ACCENT.bg,
                                                    borderTop: `2.5px solid ${ACCENT.border}`,
                                                    boxShadow: `0 0 20px ${ACCENT.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
                                                    borderLeft: `1px solid ${ACCENT.border}50`,
                                                    borderRight: `1px solid ${ACCENT.border}30`,
                                                    borderBottom: `1px solid ${ACCENT.border}20`,
                                                } : {
                                                    background: '#2d3748',
                                                    borderTop: `2.5px solid rgba(255,255,255,0.12)`,
                                                    borderLeft: `1px solid rgba(255,255,255,0.12)`,
                                                    borderRight: `1px solid rgba(255,255,255,0.12)`,
                                                    borderBottom: `1px solid rgba(255,255,255,0.06)`,
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
                                                }}
                                                className={`
                                                    flex items-center gap-3 px-5 rounded-xl text-left
                                                    transition-all duration-200 shrink-0 cursor-pointer select-none whitespace-nowrap
                                                    ${isActive ? 'scale-[1.02]' : 'hover:brightness-125 hover:scale-[1.01]'}
                                                `}
                                            >
                                                {/* Icon */}
                                                <div
                                                    style={isActive
                                                        ? { background: ACCENT.bg, border: `1px solid ${ACCENT.border}40` }
                                                        : { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }
                                                    }
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                                                >
                                                    <category.icon
                                                        className="w-[18px] h-[18px]"
                                                        style={{ color: isActive ? ACCENT.iconColor : '#cbd5e1' }}
                                                    />
                                                </div>

                                                {/* Label + count */}
                                                <div className="flex flex-col gap-0.5">
                                                    <span
                                                        className="text-[13px] font-extrabold tracking-wide leading-none"
                                                        style={{ color: isActive ? ACCENT.activeLabelColor : '#e2e8f0' }}
                                                    >
                                                        {category.name}
                                                    </span>
                                                    <span
                                                        className="text-[11px] font-semibold leading-none mt-1"
                                                        style={{ color: isActive ? ACCENT.labelColor : '#94a3b8' }}
                                                    >
                                                        {groupEvents.length} events
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Divider — hidden when search expanded */}
                                <div
                                    className="my-3 bg-slate-700/80 shrink-0 transition-all duration-300"
                                    style={{ width: searchFocused ? '0px' : '1px', opacity: searchFocused ? 0 : 1 }}
                                />

                                {/* Right: Search bar — expands to full width on focus */}
                                <div
                                    className="flex items-center py-3 transition-all duration-300"
                                    style={{
                                        flex: searchFocused ? '1 1 auto' : '0 0 auto',
                                        paddingLeft: searchFocused ? '0' : '16px',
                                        paddingRight: '0',
                                    }}
                                >
                                    <div
                                        className="flex items-center rounded-xl px-3.5 h-10 gap-2.5 group transition-all duration-300 w-full"
                                        style={searchFocused ? {
                                            background: 'rgba(37,99,235,0.12)',
                                            border: '1.5px solid #3b82f6',
                                            boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
                                        } : {
                                            background: 'rgba(30,41,59,0.8)',
                                            border: '1px solid rgba(100,116,139,0.6)',
                                        }}
                                    >
                                        <Search
                                            className="h-4 w-4 shrink-0 transition-colors duration-200"
                                            style={{ color: searchFocused ? '#60a5fa' : '#64748b' }}
                                        />
                                        <Input
                                            ref={searchInputRef}
                                            placeholder={searchFocused ? 'Type to search across all events...' : 'Search events...'}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setSearchFocused(true)}
                                            onBlur={() => { if (!searchQuery) setSearchFocused(false); }}
                                            onKeyDown={(e) => { if (e.key === 'Escape') { setSearchFocused(false); setSearchQuery(''); } }}
                                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 font-medium placeholder:text-slate-500 text-slate-100 h-full w-full transition-all duration-200"
                                            style={{ fontSize: searchFocused ? '14px' : '13px' }}
                                        />
                                        {searchQuery && (
                                            <>
                                                <Badge variant="secondary" className="font-mono text-[10px] bg-blue-600 text-white border-transparent shrink-0 px-1.5">
                                                    {filteredEvents.length}
                                                </Badge>
                                                <button
                                                    onClick={() => { setSearchQuery(''); setSearchFocused(false); searchInputRef.current?.blur(); }}
                                                    className="text-slate-400 hover:text-white text-[11px] font-bold shrink-0 ml-1 cursor-pointer"
                                                >✕</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* 3-col body */}
                            <div className="flex-1 overflow-hidden flex min-h-0">

                                {/* Center: Event Grid */}
                                <div ref={gridScrollRef} className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#f8fafc] dark:bg-slate-950">

                                    {/* Event Grid */}
                                    <div className="space-y-8 pb-24">
                                        {searchQuery ? (
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Search Results</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {filteredEvents.map((evt) => {
                                                        const meta = EVENT_METADATA[evt] || { title: evt.replace("FLTDATA_", ""), subtitle: "System trigger", Icon: Activity };
                                                        return (
                                                            <EventCard
                                                                key={evt}
                                                                evt={evt}
                                                                meta={meta}
                                                                isSelected={selectedEvent === evt}
                                                                onClick={() => {
                                                                    setSelectedEvent(evt);
                                                                    setSelectedCategory(null);
                                                                    setCustomParams(defaultParamsMapping[evt] ? JSON.stringify(defaultParamsMapping[evt]) : '');
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            Object.entries(EVENT_GROUPS).map(([category, events], idx) => {
                                                const colors = CATEGORY_COLORS[category] || { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500', badge: 'bg-slate-100 text-slate-600', header: 'bg-slate-600' };
                                                const catMeta = SIDEBAR_CATEGORIES.find(c => c.group === category);
                                                const CatIcon = catMeta?.icon || Activity;
                                                const sectionBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]';
                                                return (
                                                    <div key={category} id={`group-${category}`} className={`rounded-2xl border ${colors.border} dark:border-opacity-30 overflow-hidden`}>
                                                        {/* Section header */}
                                                        <div className={`flex items-center justify-between px-5 py-3 ${colors.bg} dark:bg-opacity-10 border-b ${colors.border} dark:border-opacity-20`}>
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`p-1.5 rounded-lg ${colors.header} bg-opacity-10`}>
                                                                    <CatIcon className={`w-4 h-4 ${colors.icon}`} />
                                                                </div>
                                                                <span className={`text-[13px] font-extrabold uppercase tracking-widest ${colors.icon}`}>{category}</span>
                                                            </div>
                                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>{events.length} events</span>
                                                        </div>
                                                        {/* Cards grid */}
                                                        <div className={`p-4 ${sectionBg === 'bg-white ' ? 'bg-white dark:bg-slate-900 ' : 'bg-[#f8fafc] dark:bg-slate-800/40 '}`}>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                                {events.map((evt) => {
                                                                    const meta = EVENT_METADATA[evt] || { title: evt.replace('FLTDATA_', ''), subtitle: 'System trigger', Icon: Activity };
                                                                    return (
                                                                        <EventCard
                                                                            key={evt}
                                                                            evt={evt}
                                                                            meta={meta}
                                                                            isSelected={selectedEvent === evt}
                                                                            onClick={() => {
                                                                                setSelectedEvent(evt);
                                                                                setSelectedCategory(null);
                                                                                setCustomParams(defaultParamsMapping[evt] ? JSON.stringify(defaultParamsMapping[evt]) : '');
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Right: Execution Panel */}
                                <div className="w-[300px] xl:w-[340px] shrink-0 border-l border-[#e2e8f0] dark:border-slate-700/60 bg-[#f8fafc] dark:bg-slate-900 overflow-y-auto">
                                    {selectedEvent ? (
                                        <div className="flex flex-col">
                                            <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                                                <div className="flex items-center gap-2 mb-1 bg-slate-200 dark:bg-slate-800/60 w-max px-2 py-1 rounded">
                                                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                        <Send className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Event Execution</span>
                                                </div>
                                                <p className="text-[14px] font-bold text-slate-800 mt-2">
                                                    {EVENT_METADATA[selectedEvent]?.title || selectedEvent}
                                                </p>
                                            </div>

                                            <div className="p-5 space-y-5">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">PARAMS</label>
                                                    <Input
                                                        placeholder='e.g., ["35000"] or [1]'
                                                        value={customParamParams}
                                                        onChange={(e) => setCustomParams(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleFireEvent(selectedEvent, customParamParams === '');
                                                        }}
                                                        className="rounded-xl border-slate-200 bg-slate-50 font-mono text-[13px] h-11 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:bg-white transition-all placeholder:text-slate-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                        <Info className="w-3 h-3" /> JSON Preview
                                                    </label>
                                                    {(() => {
                                                        const isDefault = customParamParams === '';
                                                        let isError = false;
                                                        let errorMsg = '';
                                                        let displayParamsStr = '[]';
                                                        if (isDefault) {
                                                            displayParamsStr = defaultParamsMapping[selectedEvent]
                                                                ? JSON.stringify(defaultParamsMapping[selectedEvent])
                                                                : '[]';
                                                        } else {
                                                            try {
                                                                const parsed = JSON.parse(customParamParams);
                                                                if (Array.isArray(parsed)) {
                                                                    displayParamsStr = JSON.stringify(parsed);
                                                                } else {
                                                                    isError = true;
                                                                    errorMsg = 'Payload must be a JSON array, e.g. [1] or ["value"]';
                                                                    displayParamsStr = customParamParams;
                                                                }
                                                            } catch {
                                                                isError = true;
                                                                errorMsg = 'Invalid JSON — check brackets, quotes, and commas';
                                                                displayParamsStr = customParamParams;
                                                            }
                                                        }
                                                        return (
                                                            <div className="space-y-2">
                                                                <div className={`rounded-xl p-4 font-mono text-[12px] leading-relaxed overflow-hidden transition-all ${isError ? 'bg-[#1a0a0a] border border-red-900/50' : 'bg-[#0f172a] border border-slate-700/40'}`}>
                                                                    <span className="text-slate-400">{'{'}</span><br />
                                                                    <span className="text-slate-400 pl-4">"eventName":&nbsp;</span>
                                                                    <span className="text-emerald-400 break-all">"{selectedEvent}"</span>
                                                                    <span className="text-slate-400">,</span><br />
                                                                    <span className="text-slate-400 pl-4">"params":&nbsp;</span>
                                                                    {isError ? (
                                                                        <span className="text-red-400/60 italic break-all">{displayParamsStr}</span>
                                                                    ) : (
                                                                        <span className={`font-bold break-all px-1 rounded ${isDefault ? 'text-blue-300' : 'text-yellow-300'}`}>
                                                                            {displayParamsStr}
                                                                        </span>
                                                                    )}
                                                                    <br />
                                                                    <span className="text-slate-400">{'}'}</span>
                                                                </div>
                                                                {/* Friendly error badge */}
                                                                {isError && (
                                                                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[11px] font-semibold text-amber-700 leading-snug">{errorMsg}</span>
                                                                    </div>
                                                                )}
                                                                {/* Live typing indicator */}
                                                                {!isDefault && !isError && (
                                                                    <div className="flex items-center gap-1.5 px-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Custom payload active</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {QUICK_ACTIONS[selectedEvent] && (
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Quick Actions
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {QUICK_ACTIONS[selectedEvent].map((action) => {
                                                                const isActive = customParamParams === action.value;
                                                                return (
                                                                    <button
                                                                        key={action.label}
                                                                        onClick={() => setCustomParams(action.value)}
                                                                        className={`h-9 px-4 rounded-full text-[13px] font-bold transition-all border ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'}`}
                                                                    >
                                                                        {action.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Transmit button — sits naturally after content */}
                                                <button
                                                    onClick={() => handleFireEvent(selectedEvent, customParamParams === '')}
                                                    disabled={loading}
                                                    className="w-full mt-2 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13px] tracking-widest uppercase transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                    {loading ? 'Transmitting...' : 'Transmit Event'}
                                                </button>
                                            </div>


                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                            <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 mb-5">
                                                <Send className="w-9 h-9 text-slate-300" />
                                            </div>
                                            <h4 className="text-[15px] font-bold text-slate-700 mb-2">Select an Event</h4>
                                            <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                                                Choose any event from the library to configure its payload and transmit.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>) :
                    (<div className="flex-1 overflow-hidden flex min-h-0">

                        {/* Center: Event Grid */}
                        <div ref={gridScrollRef} className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#f8fafc] dark:bg-slate-950">

                            {/* Event Grid */}

                            <div className="space-y-8 pb-24 flex items-center justify-center h-full">
                                <div className="p-5 bg-slate-200 rounded-[24px] border border-slate-100 mb-5 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-900 dark:text-blue-300 text-[12px] font-bold  flex flex-col items-center gap-3">
                                    <Plane className="w-9 h-9 text-red-400" />
                                    <p className=''>Please <b className='font-bold text-emerald-500'>Open the Flight</b> to view and trigger events.</p>
                                    <button onClick={() => handleFireEvent("OPEN_FLIGHT", false, "[1]")} disabled={loading} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold rounded-full transition-colors cursor-pointer">
                                        Open Flight
                                    </button>

                                </div>

                            </div>
                        </div>

                        {/* Right: Execution Panel */}
                        <div className="w-[300px] xl:w-[340px] shrink-0 border-l border-[#e2e8f0] dark:border-slate-700/60 bg-[#f8fafc] dark:bg-slate-900 overflow-y-auto">
                            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 mb-5">
                                    <Send className="w-9 h-9 text-slate-300" />
                                </div>
                                <h4 className="text-[15px] font-bold text-slate-700 mb-2">Select an Event</h4>
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                                    Please <b className='font-bold text-emerald-500'>Open the Flight</b> for viewing the events
                                </p>
                            </div>
                        </div>
                    </div>)

                }
            </div>
        </div >
    );
};

const EventCard = ({ meta, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`group text-left w-full rounded-2xl border p-4 transition-all duration-200 flex flex-row gap-3 cursor-pointer ${isSelected
            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md'
            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
            }`}
    >
        <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500 group-hover:bg-blue-50/60 group-hover:text-blue-500'}`}>
                <meta.Icon className="w-5 h-5" />
            </div>

        </div>
        <div>
            <p className="text-[13px] font-extrabold tracking-tight text-slate-800 leading-tight">{meta.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{meta.subtitle}</p>
        </div>
    </button>
);

export default CrewTerminalPage;
