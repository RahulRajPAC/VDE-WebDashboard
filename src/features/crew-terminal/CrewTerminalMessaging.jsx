import React, { useState } from "react";
import {
    MessageSquare, MessageCircle, Wifi, Monitor, GitBranch,
    Send, CheckCircle, XCircle, Loader2, ChevronRight, ChevronLeft,
    Clock, Hash, Tag, RadioTower, Zap, ShieldAlert, Info, Utensils, Star,
    Terminal, Activity, Accessibility as AccessibilityIcon, ToggleRight, Moon
} from "lucide-react";
import CrewHeader from './components/CrewHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import useCrewTerminalStatus from './hooks/useCrewTerminalStatus';

import { PREDEFINED_MESSAGES, MESSAGE_TYPES, defaultForms, buildBody, getBaseUrl } from './constants/messagingConstants';
import { Label, Input, Textarea, Toggle, PayloadPreview, FreetextForm, ConnectingGateForm, ScreensaverForm, AccessibilityForm } from './components/MessageForms';
import { useNavigate } from 'react-router-dom';

// ── Main component ────────────────────────────────────────────────────────────
export default function CrewTerminalMessaging() {
    const [activeType, setActiveType] = useState("predefined");
    const [forms, setForms] = useState(defaultForms);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState(null); // for predefined catalog
    const [activeCategory, setActiveCategory] = useState(PREDEFINED_MESSAGES[0].category);
    const navigate = useNavigate();

    const {
        clientsConnected,
        isFlightOpen,
        serverLogs,
        fetchingLogs,
        showLogs,
        setShowLogs,
        fetchServerLogs
    } = useCrewTerminalStatus();

    const typeDef = MESSAGE_TYPES.find(t => t.key === activeType);
    const accent = typeDef?.accent || MESSAGE_TYPES[0].accent;
    const form = forms[activeType];

    const onChange = (field, val) => {
        setForms(prev => ({ ...prev, [activeType]: { ...prev[activeType], [field]: val } }));
    };

    const applyPreset = (msg) => {
        setSelectedPreset(msg);
        setStatus(null);
        setForms(prev => ({
            ...prev,
            predefined: {
                ...defaultForms.predefined,
                pmid: msg.pmid.toString(),
                timeout: msg.timeout.toString(),
                message: msg.message,
                mid: msg.mid?.toString() || ""
            }
        }));
    };

    const handleSend = async () => {
        setStatus(null);
        setLoading(true);
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
            case "predefined": return (
                <div className="flex flex-col gap-6">
                    <button onClick={() => { setSelectedPreset(null); setStatus(null); }} className="text-blue-500 text-[13px] font-bold flex items-center gap-1.5 hover:text-blue-600 transition-colors self-start w-fit cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back to templates</button>

                    <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[16px] border border-slate-200 dark:border-slate-700/50 relative overflow-hidden">
                        <ShieldAlert className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-900/[0.03] dark:text-white/[0.02]" />
                        <h3 className="text-slate-800 dark:text-slate-100 font-bold">{selectedPreset?.label}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed m-0">{selectedPreset?.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-2">
                        <div className="flex flex-col gap-3">
                            <Label>Timeout (seconds)</Label>
                            <Input
                                type="number"
                                value={form.timeout}
                                onChange={(e) => onChange("timeout", e.target.value)}
                                placeholder="eg. 30"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Label>Internal PMID</Label>
                            <div className="bg-slate-100 dark:bg-[rgba(255,255,255,0.03)] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 flex items-center shadow-inner opacity-70">
                                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{form.pmid}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case "accessibility": return <AccessibilityForm form={form} onChange={onChange} accent={accent} />;
            case "freetext": return <FreetextForm form={form} onChange={onChange} />;
            case "connecting_gate": return <ConnectingGateForm form={form} onChange={onChange} accent={accent} />;
            case "screensaver": return <ScreensaverForm form={form} onChange={onChange} accent={accent} />;
            default: return null;
        }
    };

    return (
        <div className="w-full h-full flex justify-center p-6 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div className="w-full max-w-[1100px] flex flex-col">

                <CrewHeader
                    title="Messaging"
                    subtitle="Compose and broadcast CMI messages to interactive seat displays."
                    isFlightOpen={isFlightOpen}
                    clientsConnected={clientsConnected}
                    showLogs={showLogs}
                    setShowLogs={setShowLogs}
                    fetchServerLogs={fetchServerLogs}
                    fetchingLogs={fetchingLogs}
                    serverLogs={serverLogs}
                />
                {/* Main Two Column Area */}

                {isFlightOpen ? (

                    < div className="flex flex-col md:flex-row gap-6 items-stretch w-full min-h-[500px] flex-1">
                        {/* ── LEFT COL: Select Type ────────────────────────────────────────── */}
                        <div className="w-[280px] shrink-0 flex flex-col bg-slate-50 dark:bg-[#151720] rounded-[24px] p-4 shadow-sm dark:shadow-[0_8px_40px_rgb(0,0,0,0.5)] border border-slate-200 dark:border-slate-800/80">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600 mb-5 px-3 mt-2 text-center md:text-left">Select Type</p>

                            <div className="flex flex-col gap-2.5">
                                {MESSAGE_TYPES.map(t => {
                                    const active = activeType === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => { setActiveType(t.key); setStatus(null); setSelectedPreset(null); }}
                                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] text-left transition-all duration-200 cursor-pointer border ${active ? 'bg-blue-600 dark:bg-[rgba(59,130,246,0.15)] border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.3)] dark:shadow-none' : 'bg-white dark:bg-transparent border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                        >
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${active ? 'bg-blue-500 dark:bg-blue-600 border-blue-400 dark:border-blue-500 shadow-sm text-white' : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.02)] text-slate-500 dark:text-slate-500 border-transparent dark:border-white/5'}`}>
                                                <t.Icon className={`w-5 h-5 ${active ? 'opacity-100' : 'opacity-80'}`} />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className={`text-[13px] font-bold leading-tight truncate transition-colors ${active ? 'text-white dark:text-blue-50' : 'text-slate-700 dark:text-slate-300'}`}>{t.label}</span>
                                                <span className={`text-[10px] leading-tight mt-0.5 font-medium transition-colors ${active ? 'text-blue-200 dark:text-blue-200/70' : 'text-slate-500 dark:text-slate-500'}`}>{t.subtitle}</span>
                                            </div>
                                            <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 shrink-0 transition-colors ${active ? 'bg-blue-800 dark:bg-[#0f172a] text-white' : 'bg-slate-200 dark:bg-[rgba(255,255,255,0.06)] text-slate-500 dark:text-slate-400'}`}>
                                                T{t.typeCode}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── RIGHT COL: Form Panel ───────────────────────────────────────── */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-[#151720] rounded-[24px] shadow-sm dark:shadow-[0_8px_40px_rgb(0,0,0,0.5)] border border-slate-200 dark:border-slate-800/80 relative">
                            {/* Header */}
                            <div className="px-7 py-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${status?.ok
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                        : status && !status.ok
                                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                                            : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.03)] border-slate-200 dark:border-slate-700/50'
                                        }`}>
                                        <typeDef.Icon className={`w-5 h-5 ${status?.ok
                                            ? 'text-emerald-500'
                                            : status && !status.ok
                                                ? 'text-red-500'
                                                : activeType === 'predefined' ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <h2 className={`text-[15px] font-bold mb-0.5 ${status?.ok
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : status && !status.ok
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-slate-800 dark:text-slate-100'
                                            }`}>
                                            {status?.ok ? 'Broadcast Sent Successfully' : status && !status.ok ? 'Broadcast Failed' : activeType === 'predefined' ? (selectedPreset ? selectedPreset.label : 'Templates') : typeDef.label}
                                        </h2>
                                        <p className={`text-[11px] font-medium ${status?.ok
                                            ? 'text-emerald-500/80 dark:text-emerald-500/60'
                                            : status && !status.ok
                                                ? 'text-red-500/80 dark:text-red-500/60'
                                                : 'text-slate-500 dark:text-slate-400/80'
                                            }`}>
                                            {status?.ok ? 'Transmitted to all clients' : status && !status.ok ? 'Something went wrong' : activeType === 'predefined' ? (selectedPreset ? 'Adjust timeout if required, then send' : 'Select a message') : typeDef.description}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-extrabold px-3 py-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-full text-slate-600 dark:text-slate-300">
                                    T{typeDef.typeCode}
                                </span>
                            </div>

                            {/* Main Content Area */}
                            {/* Main Content Area */}
                            {activeType === 'predefined' && !selectedPreset && !status ? (
                                <>
                                    {/* Predefined specific navbar */}
                                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-transparent overflow-x-auto no-scrollbar shrink-0">
                                        <div className="flex items-center gap-2">
                                            {PREDEFINED_MESSAGES.map(group => {
                                                const active = activeCategory === group.category;
                                                return (
                                                    <button
                                                        key={group.category}
                                                        onClick={() => setActiveCategory(group.category)}
                                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all duration-150 border ${active ? 'opacity-100' : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 opacity-80'}`}
                                                        style={active ? { background: group.color + "15", color: group.color, borderColor: group.color + "40" } : {}}
                                                    >
                                                        <group.icon className="w-3.5 h-3.5" />
                                                        {group.category}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="flex flex-col">
                                            {PREDEFINED_MESSAGES.find(g => g.category === activeCategory)?.messages.map((msg, idx) => {
                                                const sel = selectedPreset?.pmid === msg.pmid;
                                                return (
                                                    <button
                                                        key={msg.pmid}
                                                        onClick={() => applyPreset(msg)}
                                                        className={`w-full text-left px-8 py-5 transition-all cursor-pointer flex items-center justify-between group relative ${sel ? 'bg-slate-100/50 dark:bg-[rgba(255,255,255,0.03)]' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-[rgba(255,255,255,0.015)]'}`}
                                                    >
                                                        {idx > 0 && <div className="absolute top-0 left-8 right-8 h-[1px] bg-slate-200 dark:bg-slate-800/60" />}
                                                        <div className="flex-1 min-w-0 pr-6">
                                                            <h3 className={`text-[13px] font-bold mb-1.5 transition-colors ${sel ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:dark:text-white'}`}>
                                                                {msg.label}
                                                            </h3>
                                                            <p className="text-[11px] leading-relaxed line-clamp-2 text-slate-500 dark:text-slate-500 font-medium opacity-90">
                                                                {msg.message}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2.5 shrink-0">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sel ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600/50 text-slate-700 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-800/30 border-transparent text-slate-500 dark:text-slate-500/80'}`}>
                                                                {msg.pmid}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 opacity-70">
                                                                <Clock className="w-3 h-3 text-slate-500 dark:text-slate-500" />
                                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500">{msg.timeout}s</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : status?.ok ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-full max-w-lg space-y-4 text-left overflow-y-auto">
                                        {status.xml && (
                                            <div className="flex flex-col rounded-[16px] border border-slate-200 dark:border-slate-700/80 overflow-hidden">
                                                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                                                    <RadioTower className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">XML Payload</span>
                                                </div>
                                                <pre className="px-5 py-4 text-[12px] font-mono bg-white dark:bg-[#0a0f1a] text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap break-all leading-relaxed max-h-[140px] overflow-y-auto">
                                                    {status.xml}
                                                </pre>
                                            </div>
                                        )}
                                        {status.payload && (
                                            <div className="flex flex-col rounded-[16px] border border-slate-200 dark:border-slate-700/80 overflow-hidden">
                                                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                                                    <RadioTower className="w-4 h-4 text-blue-500" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">JSON Payload</span>
                                                </div>
                                                <pre className="px-5 py-4 text-[12px] font-mono bg-white dark:bg-[#0a0f1a] text-blue-500 dark:text-blue-400 whitespace-pre-wrap break-all leading-relaxed max-h-[140px] overflow-y-auto">
                                                    {JSON.stringify(JSON.parse(status.payload), null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setStatus(null); setSelectedPreset(null); }}
                                        className="mt-8 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold transition-colors cursor-pointer"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : status && !status.ok ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-5">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                                        Broadcast Failed
                                    </h2>
                                    <p className="text-[13px] text-red-400 mb-8 font-medium max-w-sm">
                                        {status.msg}
                                    </p>
                                    <button
                                        onClick={() => setStatus(null)}
                                        className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-[13px] font-bold transition-colors cursor-pointer"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-8">
                                    {renderForm()}
                                </div>
                            )}

                            {/* Footer (Hidden if showing status or if predefined template is not selected) */}
                            {!(activeType === 'predefined' && !selectedPreset) && !status?.ok && (
                                <>
                                    {/* Empty spacing for absolute footer */}
                                    <div className="h-[74px] shrink-0"></div>

                                    {/* Footer */}
                                    <div className="h-[74px] px-8 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#12141a] flex items-center justify-between shrink-0 rounded-b-[24px] absolute bottom-0 left-0 right-0 z-10">
                                        <div className="flex items-center gap-2.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                                            {loading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Broadcasting...</>
                                            ) : status?.ok ? (
                                                <><CheckCircle className="w-4 h-4 text-emerald-500" /> Broadcast Sent</>
                                            ) : status?.msg ? (
                                                <><XCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> <span className="truncate max-w-[200px]">{status.msg}</span></>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleSend}
                                            disabled={loading}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-400 disabled:text-slate-200 text-white font-bold py-2.5 px-6 rounded-full transition-all tracking-wide text-[13px] shadow-[0_3px_12px_rgba(37,99,235,0.25)] flex items-center gap-2 cursor-pointer"
                                        >
                                            Send Message
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                ) : (
                    <div className=" flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-2xl h-full ">
                        <div className="flex flex-col items-center justify-center  bg-white dark:bg-blue-900 mt-10 p-4 rounded-2xl m-4">
                            <h1 className="text-2xl font-semibold text-slate-400  dark:text-slate-100 mb-2">Flight is <span className="text-red-500">"closed"</span></h1>
                            <h2 className="text-2xl font-semibold text-slate-400 dark:text-slate-100 mb-2">Please <span className="text-green-500">Open the flight</span> first to use "Message feature"</h2>
                        </div>
                        <button onClick={() => navigate('/crew-terminal')} className="p-4 bg-emerald-500 rounded-full hover:bg-emerald-300 transition-colors cursor-pointer ">Go to PACIO-Events</button>
                    </div>
                )}

            </div>
        </div >
    );
}
