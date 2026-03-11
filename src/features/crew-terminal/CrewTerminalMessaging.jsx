import React, { useState, useEffect } from "react";
import {
    MessageSquare, MessageCircle, Wifi, Monitor, GitBranch,
    Send, CheckCircle, XCircle, Loader2, ChevronRight, ChevronLeft,
    Clock, Hash, Tag, RadioTower, Zap, ShieldAlert, Info, Utensils, Star,
    Terminal, Activity
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

// ── Predefined message catalog ────────────────────────────────────────────────
const PREDEFINED_MESSAGES = [
    {
        category: "Safety",
        color: "#ef4444",
        icon: ShieldAlert,
        messages: [
            { pmid: 1, mid: 7101, timeout: 30, label: "Fasten Seatbelt", message: "Please make sure to be seated and fasten your seat belt tight and low, ensuring it is not twisted." },
            { pmid: 2, mid: 7102, timeout: 25, label: "Return to Seat", message: "Please return to your seat and fasten your seatbelt. We are experiencing turbulence." },
            { pmid: 3, mid: 7103, timeout: 20, label: "Tray Table Up", message: "Please stow your tray table and return your seat back to the upright position for landing." },
            { pmid: 4, mid: 7104, timeout: 20, label: "Window Shade Up", message: "Please open your window shade for landing. Thank you for your cooperation." },
            { pmid: 5, mid: 7105, timeout: 30, label: "Emergency Exit Info", message: "Please review the safety card in your seat pocket and note the nearest emergency exit." },
        ]
    },
    {
        category: "Service",
        color: "#3b82f6",
        icon: Star,
        messages: [
            { pmid: 6, mid: 7201, timeout: 20, label: "Meal Service Soon", message: "Meal service will begin shortly. Please stow your tray table if it is currently open." },
            { pmid: 7, mid: 7202, timeout: 20, label: "Duty Free Available", message: "Duty free shopping is now available. Our crew will be passing through the cabin shortly." },
            { pmid: 8, mid: 7203, timeout: 25, label: "Drink Service", message: "Drinks service is now available. Please press your call button if you would like to place an order." },
            { pmid: 9, mid: 7204, timeout: 15, label: "Survey Request", message: "We value your feedback! Please take a moment to complete our onboard satisfaction survey." },
        ]
    },
    {
        category: "Flight Info",
        color: "#10b981",
        icon: Info,
        messages: [
            { pmid: 10, mid: 7301, timeout: 20, label: "Prepare for Landing", message: "We will be landing shortly. Please ensure your seat belt is fastened and all electronic devices are stowed." },
            { pmid: 11, mid: 7302, timeout: 20, label: "Cruising Altitude", message: "We have reached our cruising altitude. You may now use approved electronic devices in airplane mode." },
            { pmid: 12, mid: 7303, timeout: 25, label: "Connecting Flight", message: "Passengers with connecting flights, please see the connecting gate information shown on your display." },
            { pmid: 13, mid: 7304, timeout: 15, label: "Local Time Update", message: "We are approaching our destination. Please adjust your watch to local time as shown on the moving map." },
        ]
    },
    {
        category: "Entertainment",
        color: "#8b5cf6",
        icon: Zap,
        messages: [
            { pmid: 14, mid: 7401, timeout: 15, label: "IFE System Available", message: "Your in-flight entertainment system is now available. Enjoy your flight!" },
            { pmid: 15, mid: 7402, timeout: 15, label: "IFE Maintenance Mode", message: "The entertainment system is temporarily unavailable for maintenance. We apologize for the inconvenience." },
            { pmid: 16, mid: 7403, timeout: 20, label: "New Content Available", message: "New movies and shows have been added to your entertainment selection. Check out the latest releases!" },
        ]
    },
];

// ── API base ──────────────────────────────────────────────────────────────────
const getBaseUrl = () => `http://${window.location.hostname}:50603`;

// ── Message type definitions ──────────────────────────────────────────────────
const MESSAGE_TYPES = [
    {
        key: "predefined",
        label: "Predefined",
        subtitle: "Catalog message",
        typeCode: "1",
        Icon: MessageSquare,
        accent: { border: "#3b82f6", glow: "rgba(59,130,246,0.25)", bg: "rgba(59,130,246,0.10)", icon: "#93c5fd", badge: "#1e40af", text: "#bfdbfe" },
        description: "Send a pre-defined catalog message to the seat. The PMID identifies the catalog entry on the IFE unit.",
    },
    {
        key: "freetext",
        label: "Free Text",
        subtitle: "Custom message",
        typeCode: "1",
        Icon: MessageCircle,
        accent: { border: "#10b981", glow: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.10)", icon: "#6ee7b7", badge: "#065f46", text: "#a7f3d0" },
        description: "Compose any free-text notification to appear on the passenger display. PMID is auto-set to −1 per spec.",
    }
];

// ── Default form states ───────────────────────────────────────────────────────
const defaultForms = {
    predefined: { pmid: "", timeout: "20", mid: "", message: "" },
    freetext: { timeout: "20", message: "" },
    connecting_gate: { timeout: "20", state: "ENABLE" },
    screensaver: { timeout: "20", state: "on" },
    wireless_custom: { timeout: "20", message: "" },
};

// ── Build API body ────────────────────────────────────────────────────────────
const buildBody = (type, form) => {
    const timeout = form.timeout ? Number(form.timeout) : undefined;
    const base = { messageType: type, ...(timeout && { timeout }) };
    switch (type) {
        case "predefined": return { ...base, ...(form.pmid && { pmid: Number(form.pmid) }), ...(form.mid && { mid: Number(form.mid) }), message: form.message };
        case "freetext": return { ...base, message: form.message };
        case "connecting_gate": return { ...base, state: form.state };
        case "screensaver": return { ...base, state: form.state };
        case "wireless_custom": return { ...base, message: form.message };
        default: return base;
    }
};

// ── Shared UI primitives ──────────────────────────────────────────────────────
const Label = ({ children, hint }) => (
    <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{children}</span>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </div>
);

const Input = ({ ...props }) => (
    <input
        {...props}
        className="w-full bg-slate-900 border border-slate-600/50 rounded-xl px-4 py-3 text-[13px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/70 focus:bg-slate-900/80 transition-all"
    />
);

const Textarea = ({ ...props }) => (
    <textarea
        {...props}
        className="w-full bg-slate-900 border border-slate-600/50 rounded-xl px-4 py-3 text-[13px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/70 focus:bg-slate-900/80 transition-all resize-none"
    />
);

const Toggle = ({ value, options, onChange, accent }) => (
    <div className="flex gap-2">
        {options.map(opt => {
            const active = value === opt.value;
            return (
                <button key={opt.value} onClick={() => onChange(opt.value)}
                    className="flex-1 py-3 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-150 cursor-pointer"
                    style={active
                        ? { background: accent.bg, border: `1.5px solid ${accent.border}`, color: accent.text, boxShadow: `0 0 14px ${accent.glow}` }
                        : { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#64748b" }
                    }
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

const PayloadPreview = ({ label, value }) => (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60">
        <div className="px-4 py-2 border-b border-slate-700/40 flex items-center gap-2">
            <RadioTower className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <pre className="px-4 py-3 text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">{value}</pre>
    </div>
);

// ── Per-type form panels ──────────────────────────────────────────────────────
const PredefinedForm = ({ form, onChange, accent }) => {
    const [selectedLabel, setSelectedLabel] = useState(null);

    const applyPreset = (msg) => {
        onChange("pmid", String(msg.pmid));
        onChange("mid", String(msg.mid));
        onChange("timeout", String(msg.timeout));
        onChange("message", msg.message);
        setSelectedLabel(msg.label);
    };

    return (
        <div className="flex gap-5 h-full min-h-0">

            {/* ── Quick-pick catalog ─────────────────────────────────── */}
            <div className="w-52 shrink-0 flex flex-col gap-1 overflow-y-auto pr-1"
                style={{ maxHeight: 420 }}
            >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 px-0.5">Quick Pick</p>
                {PREDEFINED_MESSAGES.map(group => (
                    <div key={group.category} className="mb-2">
                        <div className="flex items-center gap-1.5 px-1 py-1 mb-1">
                            <group.icon className="w-3 h-3" style={{ color: group.color }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: group.color }}>
                                {group.category}
                            </span>
                        </div>
                        {group.messages.map(msg => (
                            <button
                                key={msg.pmid}
                                onClick={() => applyPreset(msg)}
                                className="w-full text-left px-3 py-2 rounded-xl mb-1 transition-all duration-100 cursor-pointer"
                                style={selectedLabel === msg.label
                                    ? { background: accent.bg, border: `1.5px solid ${accent.border}`, boxShadow: `0 0 10px ${accent.glow}` }
                                    : { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.07)" }
                                }
                            >
                                <div className="text-[12px] font-semibold leading-tight mb-0.5"
                                    style={{ color: selectedLabel === msg.label ? accent.text : "#94a3b8" }}>
                                    {msg.label}
                                </div>
                                <div className="text-[10px] font-mono" style={{ color: selectedLabel === msg.label ? accent.icon : "#475569" }}>
                                    pmid:{msg.pmid} · {msg.timeout}s
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* ── Editable fields ────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label hint="seconds">Timeout</Label>
                        <Input type="number" placeholder="20" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
                    </div>
                </div>
                <div>
                    <Label hint="optional catalog ID">Mid</Label>
                    <Input type="number" placeholder="e.g. 7560" value={form.mid} onChange={e => onChange("mid", e.target.value)} />
                </div>
                <div>
                    <Label hint="required">Message Text</Label>
                    <Textarea rows={5} placeholder="Select a quick pick or type a message..." value={form.message} onChange={e => onChange("message", e.target.value)} />
                </div>
                {form.message && (
                    <PayloadPreview label="XML preview"
                        value={`<msg pmid="${form.pmid || 651}" timeout="${form.timeout || 20}"${form.mid ? ` mid="${form.mid}"` : ""}>${form.message}</msg>`}
                    />
                )}
            </div>
        </div>
    );
};

const FreetextForm = ({ form, onChange }) => (
    <div className="flex flex-col gap-5">
        <div>
            <Label hint="seconds, default: 20">Timeout</Label>
            <Input type="number" placeholder="20" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
        </div>
        <div>
            <Label hint="required — free text">Message</Label>
            <Textarea rows={6} placeholder="Type your free-text message here..." value={form.message} onChange={e => onChange("message", e.target.value)} />
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400">PMID is automatically set to <span className="font-mono text-slate-300">-1</span> per PAC spec for free text messages</span>
        </div>
        {form.message && (
            <PayloadPreview label="XML preview"
                value={`<msg pmid="-1" timeout="${form.timeout || 20}">${form.message}</msg>`}
            />
        )}
    </div>
);

const ConnectingGateForm = ({ form, onChange, accent }) => (
    <div className="flex flex-col gap-5">
        <div>
            <Label hint="seconds, default: 20">Timeout</Label>
            <Input type="number" placeholder="20" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
        </div>
        <div>
            <Label>Gate State</Label>
            <Toggle value={form.state} options={[{ label: "✓  ENABLE", value: "ENABLE" }, { label: "✕  DISABLE", value: "DISABLE" }]} onChange={v => onChange("state", v)} accent={accent} />
        </div>
        <PayloadPreview label="Wire payload" value={`CG|${form.state || "ENABLE"}`} />
        <PayloadPreview label="XML envelope" value={`<msg pmid="-1" timeout="${form.timeout || 20}">CG|${form.state || "ENABLE"}</msg>`} />
    </div>
);

const ScreensaverForm = ({ form, onChange, accent }) => (
    <div className="flex flex-col gap-5">
        <div>
            <Label hint="seconds, default: 20">Timeout</Label>
            <Input type="number" placeholder="20" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
        </div>
        <div>
            <Label>Screen Saver State</Label>
            <Toggle value={form.state} options={[{ label: "● Turn ON", value: "on" }, { label: "○ Turn OFF", value: "off" }]} onChange={v => onChange("state", v)} accent={accent} />
        </div>
        <PayloadPreview label="Wire payload" value={`ctMsg|screensaver|${form.state || "on"}`} />
        <PayloadPreview label="XML envelope" value={`<msg pmid="-1" timeout="${form.timeout || 20}">ctMsg|screensaver|${form.state || "on"}</msg>`} />
    </div>
);


// ── Main component ────────────────────────────────────────────────────────────
export default function CrewTerminalMessaging() {
    const [activeType, setActiveType] = useState("predefined");
    const [forms, setForms] = useState(defaultForms);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState(null); // for predefined catalog
    const [activeCategory, setActiveCategory] = useState(PREDEFINED_MESSAGES[0].category);

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
            } catch (error) {
                // Silently ignore polling errors
            }
        };

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
            const response = await fetch(`${getBaseUrl()}/api/logs`);
            const data = await response.json();
            setServerLogs(data.logs || 'No logs available');
        } catch (err) {
            setServerLogs('Error fetching logs: ' + err.message);
        } finally {
            setFetchingLogs(false);
        }
    };

    const typeDef = MESSAGE_TYPES.find(t => t.key === activeType);
    const accent = typeDef.accent;
    const form = forms[activeType];

    const onChange = (field, value) =>
        setForms(prev => ({ ...prev, [activeType]: { ...prev[activeType], [field]: value } }));

    // Selecting a preset populates the predefined form AND highlights the card
    const applyPreset = (msg) => {
        setSelectedPreset(msg);
        setStatus(null);
        setForms(prev => ({
            ...prev,
            predefined: {
                pmid: String(msg.pmid),
                mid: String(msg.mid),
                timeout: String(msg.timeout),
                message: msg.message,
            }
        }));
    };

    const handleSend = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const body = buildBody(activeType, form);
            const res = await fetch(`${getBaseUrl()}/api/trigger-cmi`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Broadcast successful!');
                setStatus({ ok: true, msg: `Broadcast successful — typeCode ${data.typeCode}`, xml: data.xmlString, payload: data.payload });
            } else {
                toast.error(data.error || "Unknown error from server");
                setStatus({ ok: false, msg: data.error || "Unknown error from server" });
            }
        } catch (err) {
            toast.error(`Network error: ${err.message}`);
            setStatus({ ok: false, msg: `Network error: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        switch (activeType) {
            case "freetext": return <FreetextForm form={form} onChange={onChange} />;
            case "connecting_gate": return <ConnectingGateForm form={form} onChange={onChange} accent={accent} />;
            case "screensaver": return <ScreensaverForm form={form} onChange={onChange} accent={accent} />;
            default: return null;
        }
    };

    return (
        <div className="w-full" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Page title & Status ────────────────────────────────────── */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="bg-blue-500 p-4 rounded-xl flex-1 flex flex-row justify-between shadow-sm">
                    <div className="flex flex-col justify">
                        <h1 className="text-2xl font-extrabold tracking-tight text-white m-0 leading-tight">Messaging</h1>
                        <p className="text-[13px] text-blue-50 mt-1 m-0">Compose and broadcast <span className="font-mono text-white opacity-90 px-1 py-0.5 bg-white/20 rounded">CMI_FOR_INTERACTIVE_DISPLAY</span> messages to seat displays.</p>
                    </div>

                    {/* Unified status card */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm shrink-0 min-h-[72px]">

                        {/* Flight Status */}
                        <div className={`flex items-center gap-3 px-5 py-2.5 h-full border-r border-slate-200 dark:border-slate-700 ${isFlightOpen ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
                            <span className="relative flex h-2 w-2 shadow-[0_0_8px_rgba(0,0,0,0.1)] rounded-full">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isFlightOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isFlightOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Flight</span>
                                <span className={`text-[13px] font-extrabold mt-0.5 ${isFlightOpen ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                                    {isFlightOpen ? 'OPEN' : 'CLOSED'}
                                </span>
                            </div>
                        </div>

                        {/* Connected clients */}
                        <div className="flex items-center gap-3 px-5 py-2.5 h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <span className="relative flex h-2 w-2 shadow-[0_0_8px_rgba(0,0,0,0.1)] rounded-full">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${clientsConnected > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${clientsConnected > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Clients</span>
                                <span className={`text-[13px] font-extrabold mt-0.5 ${clientsConnected > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                                    {clientsConnected} Connected
                                </span>
                            </div>
                        </div>

                        {/* Server Logs button */}
                        <Dialog open={showLogs} onOpenChange={(open) => {
                            if (open) fetchServerLogs();
                            setShowLogs(open);
                        }}>
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-3 px-5 py-2.5 h-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-0 outline-none">
                                    <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <div className="flex flex-col leading-none text-left">
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">View</span>
                                        <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">Server Logs</span>
                                    </div>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                                <DialogHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-5 px-6 shrink-0">
                                    <DialogTitle className="text-lg flex items-center justify-between w-full pr-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50">
                                                <Terminal className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold tracking-tight text-slate-800 dark:text-white">Pacio Server Logs</span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchServerLogs} disabled={fetchingLogs} className="text-[13px] rounded-lg px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                                            {fetchingLogs ? 'Refreshing...' : 'Refresh Logs'}
                                        </Button>
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-hidden bg-[#0f172a]">
                                    <ScrollArea className="h-full w-full text-left">
                                        <pre className="font-mono text-[11px] p-6 text-slate-300 break-words whitespace-pre-wrap leading-relaxed">
                                            {serverLogs}
                                        </pre>
                                    </ScrollArea>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* ── 3-column grid ────────────────────────────────────────────── */}
            <div className="grid gap-6" style={{ gridTemplateColumns: "240px 1fr 340px" }}>

                {/* ── Col 1: Message type selector ─────────────────────── */}
                <div className="flex flex-col gap-2 p-4 bg-slate-200 rounded-md ">
                    <p className="text-md font-bold  uppercase tracking-widest text-slate-500 px-1 mb-1 text-center">Select Type</p>
                    {MESSAGE_TYPES.map(t => {
                        const active = activeType === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => { setActiveType(t.key); setStatus(null); setSelectedPreset(null); }}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer"
                                style={active
                                    ? { background: t.accent.bg, border: `1.5px solid ${t.accent.border}`, boxShadow: `0 0 18px ${t.accent.glow}` }
                                    : { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }
                                }
                            >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={active
                                        ? { background: t.accent.bg, border: `1px solid ${t.accent.border}50` }
                                        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }
                                    }
                                >
                                    <t.Icon className="w-4 h-4" style={{ color: active ? t.accent.icon : "#64748b" }} />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[13px] font-bold leading-tight truncate"
                                        style={{ color: active ? "#f1f5f9" : "#94a3b8" }}>{t.label}</span>
                                    <span className="text-[11px] leading-tight mt-0.5"
                                        style={{ color: active ? t.accent.icon : "#475569" }}>{t.subtitle}</span>
                                </div>
                                <span className="text-[10px] font-bold rounded-lg px-2 py-1 shrink-0"
                                    style={{ background: active ? t.accent.badge : "rgba(255,255,255,0.06)", color: active ? "#fff" : "#475569" }}>
                                    T{t.typeCode}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Col 2: Catalog browser (predefined) OR Form (others) ───── */}
                {activeType === "predefined" && !selectedPreset ? (

                    /* ── PREDEFINED: full catalog browser ────────────────────── */
                    <div className="flex flex-col rounded-2xl border border-slate-700/60 overflow-hidden"
                        style={{ background: "#0f172a" }}
                    >
                        {/* Catalog header */}
                        <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between"
                            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: accent.bg, border: `1px solid ${accent.border}50` }}
                                >
                                    <MessageSquare className="w-4 h-4" style={{ color: accent.icon }} />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-bold text-slate-100">Templates</h2>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Select a message</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: accent.badge, color: "#fff" }}>TYPE 1</span>
                        </div>

                        {/* Category navbar (horizontal pills) */}
                        <div className="px-3 pt-3 pb-2 border-b border-slate-700/40 shrink-0">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                {PREDEFINED_MESSAGES.map(group => {
                                    const active = activeCategory === group.category;
                                    return (
                                        <button
                                            key={group.category}
                                            onClick={() => setActiveCategory(group.category)}
                                            className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all duration-150"
                                            style={active
                                                ? { background: group.color + "25", color: group.color, border: `1px solid ${group.color}60` }
                                                : { background: "rgba(255,255,255,0.03)", color: "#64748b", border: "1px solid transparent" }
                                            }
                                        >
                                            <group.icon className="w-3.5 h-3.5" />
                                            {group.category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message list items for active category */}
                        <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-1">
                            {PREDEFINED_MESSAGES.find(g => g.category === activeCategory)?.messages.map(msg => {
                                const sel = selectedPreset?.pmid === msg.pmid;
                                return (
                                    <button
                                        key={msg.pmid}
                                        onClick={() => applyPreset(msg)}
                                        className="w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                                        style={sel
                                            ? { background: accent.bg, border: `1px solid ${accent.border}` }
                                            : { background: "rgba(255,255,255,0.0)", border: "1px solid transparent" }
                                        }
                                    >
                                        <div className="flex-1 min-w-0 pr-3">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[12px] font-semibold truncate group-hover:text-white transition-colors"
                                                    style={{ color: sel ? accent.text : "#cbd5e1" }}>
                                                    {msg.label}
                                                </span>
                                            </div>
                                            <p className="text-[10px] truncate"
                                                style={{ color: sel ? accent.icon : "#64748b" }}>
                                                {msg.message}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-[9px] font-mono"
                                                style={{ background: sel ? accent.badge : "rgba(255,255,255,0.06)", color: sel ? "#fff" : "#94a3b8" }}>
                                                {msg.pmid}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" style={{ color: sel ? accent.icon : "#475569" }} />
                                                <span className="text-[9px] font-mono" style={{ color: sel ? accent.icon : "#64748b" }}>
                                                    {msg.timeout}s
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                ) : activeType === "predefined" && selectedPreset ? (

                    /* ── PREDEFINED: selected message detail + editable fields + send ── */
                    <div className="flex flex-col rounded-2xl border border-slate-700/60 overflow-hidden h-full"
                        style={{ background: "#0f172a" }}
                    >
                        {/* Selected header with back button */}
                        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-4"
                            style={{ background: `linear-gradient(135deg, ${accent.bg} 0%, #0f172a 100%)` }}
                        >
                            <button onClick={() => { setSelectedPreset(null); setStatus(null); }}
                                className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center transition-colors hover:bg-white/10"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-300" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-[14px] font-extrabold text-slate-100">{selectedPreset.label}</span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full font-mono"
                                        style={{ background: accent.badge, color: "#fff" }}>
                                        pmid:{selectedPreset.pmid}
                                    </span>
                                </div>
                                <p className="text-[11px] leading-snug" style={{ color: accent.text }}>
                                    {selectedPreset.message}
                                </p>
                            </div>
                        </div>

                        {/* Editable overrides */}
                        <div className="flex flex-col gap-4 p-5 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label hint="sec">Timeout</Label>
                                    <Input type="number" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <Label>Message</Label>
                                <Textarea rows={4} value={form.message} onChange={e => onChange("message", e.target.value)} />
                            </div>
                            {form.message && (
                                <PayloadPreview label="XML Preview"
                                    value={`<msg pmid="${form.pmid || 651}" timeout="${form.timeout || 20}"${form.mid ? ` mid="${form.mid}"` : ""}>${form.message}</msg>`}
                                />
                            )}
                        </div>

                        {/* Send button */}
                        <div className="px-5 pb-5 pt-4 mt-auto">
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl font-bold text-[14px] tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: `linear-gradient(135deg, ${accent.border} 0%, ${accent.icon}aa 100%)`,
                                    color: "#fff",
                                    boxShadow: loading ? "none" : `0 4px 24px ${accent.glow}`,
                                }}
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Broadcasting…</> : <><Send className="w-4 h-4" /> Send Message</>}
                            </button>
                        </div>
                    </div>

                ) : (

                    /* ── OTHER TYPES: form panel ──────────────────────────── */
                    <div className="flex flex-col rounded-2xl border border-slate-700/60 overflow-hidden"
                        style={{ background: "#0f172a" }}
                    >
                        <div className="px-6 py-5 border-b border-slate-700/60 flex items-center gap-4"
                            style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
                        >
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: accent.bg, border: `1.5px solid ${accent.border}50`, boxShadow: `0 0 16px ${accent.glow}` }}
                            >
                                <typeDef.Icon className="w-5 h-5" style={{ color: accent.icon }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-[16px] font-extrabold text-slate-100">{typeDef.label}</h2>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: accent.badge, color: "#fff" }}>
                                        TYPE {typeDef.typeCode}
                                    </span>
                                </div>
                                <p className="text-[12px] text-slate-400 mt-1 leading-snug">{typeDef.description}</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6">{renderForm()}</div>
                        <div className="px-6 py-4 border-t border-slate-700/60" style={{ background: "#0a0f1a" }}>
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl font-bold text-[14px] tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: `linear-gradient(135deg, ${accent.border} 0%, ${accent.icon}aa 100%)`,
                                    color: "#fff",
                                    boxShadow: loading ? "none" : `0 4px 24px ${accent.glow}`,
                                }}
                            >
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Broadcasting…</> : <><Send className="w-4 h-4" /> Send CMI Message</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Col 3: Status panel ─── */}
                <div className="flex flex-col gap-4">
                    <>
                        {status ? (<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Broadcast Status</p>) :
                            (<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 text-center mt-10">Awaiting send…</p>)}

                        {status?.ok && status.xml && (
                            <div className="flex flex-col rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: "#0a0f1a" }}>
                                <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2">
                                    <RadioTower className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">XML Sent</span>
                                </div>
                                <pre className="px-4 py-4 text-[11px] font-mono text-emerald-300/80 whitespace-pre-wrap break-all leading-relaxed">{status.xml}</pre>
                            </div>
                        )}
                        {status?.ok && status.payload && (
                            <div className="flex flex-col rounded-2xl border border-slate-700/50 overflow-hidden" style={{ background: "#0a0f1a" }}>
                                <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2">
                                    <RadioTower className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Payload</span>
                                </div>
                                <pre className="px-4 py-4 text-[11px] font-mono text-blue-300/80 whitespace-pre-wrap break-all leading-relaxed">
                                    {JSON.stringify(JSON.parse(status.payload), null, 2)}
                                </pre>
                            </div>
                        )}
                    </>
                </div>

            </div>
        </div>
    );
}