import React from 'react';
import { ChevronRight, Clock, Moon, Activity, Terminal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';

export default function CrewHeader({
    title,
    subtitle,
    isFlightOpen,
    clientsConnected,
    showLogs,
    setShowLogs,
    fetchServerLogs,
    fetchingLogs,
    serverLogs
}) {
    return (
        <>

            {/* Header Box */}
            <div className="bg-gradient-to-r gap-6 from-blue-600 to-blue-700 px-6 py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center shrink-0 mt-5 mb-5 rounded-2xl">
                <div className="flex flex-col text-white mb-4 lg:mb-0">
                    <h1 className="text-[28px] font-extrabold tracking-tight leading-tight mb-1" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
                        {title}
                    </h1>
                    <p className="text-[13px] opacity-90 m-0">
                        {subtitle}
                    </p>
                </div>
                {/* Status Card inside */}
                <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-sm h-[60px] shrink-0">
                    {/* Flight */}
                    <div className="flex items-center px-6 h-full border-r border-slate-100 gap-3">
                        <span className="relative flex h-2 w-2 rounded-full">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isFlightOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isFlightOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">Flight</span>
                            <span className={`text-[12px] font-extrabold mt-0.5 ${isFlightOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                                {isFlightOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                        </div>
                    </div>
                    {/* Clients */}
                    <div className="flex items-center justify-center px-6 h-full border-r border-slate-100">
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5 mb-1 text-center">Clients</span>
                            <span className={`text-[12px] font-extrabold leading-none ${clientsConnected > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {clientsConnected} <span className="font-bold text-slate-500 pl-0.5">Connected</span>
                            </span>
                        </div>
                    </div>
                    {/* Server Logs */}
                    <Dialog open={showLogs} onOpenChange={(open) => {
                        if (open) fetchServerLogs();
                        setShowLogs(open);
                    }}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-3 px-6 h-full bg-white hover:bg-slate-50 transition-colors cursor-pointer border-0 outline-none">
                                <Activity className="w-4 h-4 text-slate-300" />
                                <div className="flex flex-col text-left justify-center">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5 mb-1">View</span>
                                    <span className="text-[12px] font-extrabold text-slate-700 leading-none">Server Logs</span>
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
        </>
    );
}
