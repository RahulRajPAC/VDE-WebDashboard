import React, { useState, useEffect } from "react";
import {
    ActivitySquare,
    Send,
    Shield,
    Moon,
    Gamepad2,
    ClipboardList,
    Video,
    Coffee,
    Info,
    AlertCircle,
    Server,
    CheckCircle2,
    Save,
    Trash2
} from "lucide-react";
import { toast } from 'sonner';
import CrewHeader from "./components/CrewHeader";
import useCrewTerminalStatus from './hooks/useCrewTerminalStatus';
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

const PRESET_SERVICES = [
    {
        id: "anz_hosp",
        title: "ANZ Hospitality",
        serviceId: "107083",
        serviceName: "svcSeatHospitality",
        icon: Coffee,
        color: "amber"
    },
    {
        id: "night_mode",
        title: "Night Mode",
        serviceId: "176366",
        serviceName: "svcSeatNightMode",
        icon: Moon,
        color: "indigo"
    },
    {
        id: "ual_game",
        title: "UAL Games",
        serviceId: "111312",
        serviceName: "svcSeatGames",
        icon: Gamepad2,
        color: "emerald"
    },
    {
        id: "survey",
        title: "Adv. Surveys",
        serviceId: "30108",
        serviceName: "svcSeatAdvSurveys",
        icon: ClipboardList,
        color: "blue"
    },
    {
        id: "vod",
        title: "VOD Menus",
        serviceId: "36",
        serviceName: "svcSeatVODMenus",
        icon: Video,
        color: "rose"
    }
];

export default function CrewTerminalMIDServiceBlocking() {
    const {
        clientsConnected,
        isFlightOpen,
        serverLogs,
        fetchingLogs,
        showLogs,
        setShowLogs,
        fetchServerLogs
    } = useCrewTerminalStatus();

    const [loading, setLoading] = useState(false);

    // Store local state of toggles (optimistic UI)
    const [serviceStates, setServiceStates] = useState({});

    // Custom form
    const [customServiceId, setCustomServiceId] = useState("");
    const [customServiceName, setCustomServiceName] = useState("");
    const [customServiceTitle, setCustomServiceTitle] = useState("");
    const [savedCustomServices, setSavedCustomServices] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem("savedCustomServices");
        if (stored) {
            try {
                setSavedCustomServices(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to load saved custom services", e);
            }
        }
    }, []);

    const handleFireEvent = async (stateVal, serviceId, serviceName, manualId = null) => {
        if (!isFlightOpen) {
            toast.error("Please Open Flight first.");
            return;
        }

        setLoading(true);

        try {
            const body = {
                eventName: "MID_SERVICE_BLOCKING_CHANGE",
                state: stateVal,
                serviceId,
                serviceName
            };

            const baseUrl = `http://${window.location.hostname}:50603`;

            const response = await fetch(`${baseUrl}/api/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Successfully sent ${stateVal === 3 ? 'ON' : 'OFF'} for ${serviceName}`);
                if (manualId) {
                    setServiceStates(prev => ({
                        ...prev,
                        [manualId]: stateVal === 3
                    }));
                }
            } else {
                toast.error(data.error || "Failed to trigger matching event");
            }
        } catch {
            toast.error('Could not connect to PAC Server.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSubmit = (e, stateVal) => {
        e.preventDefault();
        if (!customServiceId.trim() || !customServiceName.trim()) {
            toast.warning("Please fill in both Service ID and Service Name");
            return;
        }
        handleFireEvent(stateVal, customServiceId.trim(), customServiceName.trim());
    };

    const handleSaveCustomService = async (stateValToTrigger = null) => {
        if (!customServiceId.trim() || !customServiceName.trim()) {
            toast.warning("Please fill in both Service ID and Service Name to save");
            return;
        }

        const newId = `custom_${Date.now()}`;
        const newService = {
            id: newId,
            title: customServiceTitle.trim() || customServiceName.trim(),
            serviceId: customServiceId.trim(),
            serviceName: customServiceName.trim(),
            icon: "ActivitySquare", // placeholder to map
            color: "purple",
            isCustom: true
        };

        const updated = [...savedCustomServices, newService];
        setSavedCustomServices(updated);
        localStorage.setItem("savedCustomServices", JSON.stringify(updated));
        toast.success("Saved Custom Service!");

        // If instructed to trigger right away also
        if (stateValToTrigger === 2 || stateValToTrigger === 3) {
            await handleFireEvent(stateValToTrigger, customServiceId.trim(), customServiceName.trim(), newId);
        }

        // Reset custom input slightly
        setCustomServiceTitle("");
        setCustomServiceId("");
        setCustomServiceName("");
    };

    const handleDeleteCustomService = (idToRemove) => {
        const updated = savedCustomServices.filter(srv => srv.id !== idToRemove);
        setSavedCustomServices(updated);
        localStorage.setItem("savedCustomServices", JSON.stringify(updated));
        toast.info("Removed custom service");
    };

    const ALL_SERVICES = [...PRESET_SERVICES, ...savedCustomServices];

    return (
        <div className="flex h-full w-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden font-sans text-slate-800 dark:text-slate-100">
            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
                <CrewHeader
                    title="MID Service Blocking"
                    subtitle="Granular control to block or unblock specific seat services globally."
                    clientsConnected={clientsConnected}
                    isFlightOpen={isFlightOpen}
                    showLogs={showLogs}
                    setShowLogs={setShowLogs}
                    fetchServerLogs={fetchServerLogs}
                    fetchingLogs={fetchingLogs}
                    serverLogs={serverLogs}
                />

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {!isFlightOpen && (
                        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-[14px] font-bold text-amber-800 dark:text-amber-400">Flight is Closed</h3>
                                <p className="text-[13px] text-amber-700/80 dark:text-amber-500/80 mt-1">
                                    Service blocking commands will be rejected. Please open the flight from the main Dashboard before transmitting these settings.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Left Column - Presets */}
                        <div className="xl:col-span-8 space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                                    <Shield className="w-5 h-5 text-blue-500" />
                                    Preconfigured Services
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Toggle standard known MID services directly. State changes are dispatched immediately as a MID_SERVICE_BLOCKING_CHANGE event.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ALL_SERVICES.map((srv) => {
                                    const isOn = serviceStates[srv.id] || false;
                                    // Use mapped icon if present, otherwise ActivitySquare for custom saves
                                    const Icon = srv.icon && typeof srv.icon !== "string" ? srv.icon : ActivitySquare;

                                    // Base colors based on config
                                    const colorMap = {
                                        amber: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200",
                                        indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200",
                                        emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200",
                                        blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200",
                                        rose: "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200",
                                        purple: "text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200"
                                    };

                                    return (
                                        <Card key={srv.id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 relative">
                                            <div className="p-5 flex flex-col h-full">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`p-2.5 rounded-xl border ${colorMap[srv.color]} dark:border-slate-700`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>

                                                    {/* Custom Action Buttons for specific State values (3=ON, 2=OFF) */}
                                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                                                        <button
                                                            disabled={loading || !isFlightOpen}
                                                            onClick={() => handleFireEvent(2, srv.serviceId, srv.serviceName, srv.id)}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isOn
                                                                ? 'bg-white shadow-sm text-black dark:bg-slate-700 dark:text-slate-200'
                                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transparent'
                                                                }`}
                                                        >
                                                            OFF
                                                        </button>
                                                        <button
                                                            disabled={loading || !isFlightOpen}
                                                            onClick={() => handleFireEvent(3, srv.serviceId, srv.serviceName, srv.id)}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isOn
                                                                ? 'bg-emerald-500 shadow-sm text-white'
                                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transparent'
                                                                }`}
                                                        >
                                                            ON
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-auto">
                                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">{srv.title}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ID: {srv.serviceId}</span>
                                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate max-w-[120px]" title={srv.serviceName}>{srv.serviceName}</span>
                                                    </div>
                                                </div>

                                                {srv.isCustom && (
                                                    <button
                                                        onClick={() => handleDeleteCustomService(srv.id)}
                                                        className="absolute bottom-4 right-4 p-1.5 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                        title="Delete Custom Service"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column - Custom Input */}
                        <div className="xl:col-span-4 space-y-6">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-t-4 border-t-purple-500">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                            <ActivitySquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Custom Service</h3>
                                            <p className="text-xs text-slate-500">Transmit to unlisted modules</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                                Service ID
                                            </label>
                                            <Input
                                                placeholder="e.g., 99999"
                                                value={customServiceId}
                                                onChange={(e) => setCustomServiceId(e.target.value)}
                                                className="bg-slate-50 dark:bg-slate-900/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                                Service Name
                                            </label>
                                            <Input
                                                placeholder="e.g., svcSeatCustom"
                                                value={customServiceName}
                                                onChange={(e) => setCustomServiceName(e.target.value)}
                                                className="bg-slate-50 dark:bg-slate-900/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center justify-between">
                                                <span>Display Title</span>
                                                <span className="text-[10px] text-slate-400 font-normal normal-case tracking-normal">Optional</span>
                                            </label>
                                            <Input
                                                placeholder="e.g., My Custom Service"
                                                value={customServiceTitle}
                                                onChange={(e) => setCustomServiceTitle(e.target.value)}
                                                className="bg-slate-50 dark:bg-slate-900/50"
                                            />
                                        </div>

                                        <div className="pt-4 grid grid-cols-2 gap-3 mb-2">
                                            <Button
                                                variant="outline"
                                                disabled={loading || !isFlightOpen}
                                                onClick={(e) => handleCustomSubmit(e, 2)}
                                                className="w-full border-slate-300 hover:bg-slate-100 font-bold"
                                            >
                                                Transmit OFF (2)
                                            </Button>
                                            <Button
                                                disabled={loading || !isFlightOpen}
                                                onClick={(e) => handleCustomSubmit(e, 3)}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                            >
                                                Transmit ON (3)
                                            </Button>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            onClick={() => handleSaveCustomService(null)}
                                            className="w-full flex items-center justify-center gap-2 border border-slate-200 text-white bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Custom Quick Action Only
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 leading-relaxed font-mono">
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">INFO: </span>
                                    State values are strictly "3" (ON) and "2" (OFF).
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}