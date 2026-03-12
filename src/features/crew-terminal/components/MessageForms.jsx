import React from 'react';
import { RadioTower, ChevronLeft, ShieldAlert } from 'lucide-react';

// ── Shared UI primitives ──────────────────────────────────────────────────────
export const Label = ({ children, hint }) => (
    <div className="flex items-baseline gap-2 mb-1.5 mt-2">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400">{children}</span>
        {hint && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{hint}</span>}
    </div>
);

export const Input = ({ ...props }) => (
    <input
        {...props}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
    />
);

export const Textarea = ({ ...props }) => (
    <textarea
        {...props}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-sm"
    />
);

export const Toggle = ({ value, options, onChange, accent }) => (
    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/50">
        {options.map(opt => {
            const active = value === opt.value;
            // Provide a light mode fallback for accent colors if needed, but accent.bg should be okay
            return (
                <button key={opt.value} onClick={() => onChange(opt.value)}
                    className="flex-1 py-2.5 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-150 cursor-pointer text-center"
                    style={active
                        ? { background: accent.bg, border: `1px solid ${accent.border}`, color: accent.text, boxShadow: `0 2px 8px ${accent.glow}` }
                        : { background: "transparent", border: "1px solid transparent", color: "#64748b" }
                    }
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

export const PayloadPreview = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 mt-3">
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700/40 flex items-center gap-2">
            <RadioTower className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <pre className="px-4 py-4 text-[11px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all leading-relaxed">{value}</pre>
    </div>
);

// ── Per-type form panels ──────────────────────────────────────────────────────
export const PredefinedForm = ({ selectedPreset, setSelectedPreset, setStatus, form, onChange }) => (
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

export const FreetextForm = ({ form, onChange }) => (
    <div className="flex flex-col gap-5">
        <div>
            <Label hint="seconds, default: 20">Timeout</Label>
            <Input type="number" placeholder="20" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
        </div>
        <div>
            <Label hint="required — free text">Message</Label>
            <Textarea rows={6} placeholder="Type your free-text message here..." value={form.message} onChange={e => onChange("message", e.target.value)} />
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-300 px-4 py-3 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] ">PMID is automatically set to <span className="font-mono text-slate-500">-1</span> per PAC spec for free text messages</span>
        </div>
        {form.message && (
            <PayloadPreview label="XML preview"
                value={`<msg pmid="-1" timeout="${form.timeout || 20}">${form.message}</msg>`}
            />
        )}
    </div>
);

export const ConnectingGateForm = ({ form, onChange, accent }) => (
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

export const ScreensaverForm = ({ form, onChange, accent }) => (
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


export const AccessibilityForm = ({ form, onChange, accent }) => {
    // We group accessibility settings. The payload allows normal/large for font_size, and different settings for color_correction_value
    const toggleOptions = [
        { key: "tts_state", label: "Text-to-Speech", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
        { key: "descriptive_audio", label: "Descriptive Audio", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
        { key: "font_size", label: "Font Size", options: [{ label: "Normal", value: "normal" }, { label: "Large", value: "large" }] },
        { key: "high_contrast", label: "High Contrast", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
        { key: "screen_magnification", label: "Magnification", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
        { key: "color_inversion", label: "Color Inversion", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
        { key: "color_correction", label: "Color Correction", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
        { key: "color_correction_value", label: "Correction Mode", options: [{ label: "Deuteranomaly", value: "deuteranomaly" }, { label: "Protanomaly", value: "protanomaly" }, { label: "Tritanomaly", value: "tritanomaly" }] },
        { key: "closed_caption", label: "Closed Captions", options: [{ label: "Enable", value: "enable" }, { label: "Disable", value: "disable" }] },
    ];

    let bodyPreview = 'accessibility';
    toggleOptions.forEach(({ key }) => {
        if (form[key]) {
            bodyPreview += `|${key}|${form[key]}`;
        }
    });

    return (
        <>
            <div className="flex flex-col gap-5 h-[420px] overflow-y-auto pr-2">
                <div>
                    <Label hint="seconds, default: 30">Timeout</Label>
                    <Input type="number" placeholder="30" value={form.timeout} onChange={e => onChange("timeout", e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {toggleOptions.map(({ key, label, options }) => (
                        <div key={key}>
                            <Label>{label}</Label>
                            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 mt-1">
                                {options.map(opt => {
                                    const active = form[key] === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onChange(key, active ? "" : opt.value)}
                                            className="flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150 cursor-pointer text-center"
                                            style={
                                                active
                                                    ? opt.value === "[1]" || opt.label.toLowerCase().includes("enable") || opt.label.toLowerCase().includes("on") || opt.label.toLowerCase().includes("open")
                                                        ? { background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", boxShadow: "0 0 8px rgba(34,197,94,0.3)" }
                                                        : { background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", boxShadow: "0 0 8px rgba(239,68,68,0.3)" }
                                                    : { background: "transparent", border: "1px solid transparent", color: "#64748b" }
                                            }
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                <PayloadPreview label="Wire payload" value={bodyPreview} />
                <PayloadPreview label="XML envelope" value={`<msg pmid="0" timeout="${form.timeout || 30}">${bodyPreview}</msg>`} />
            </div>

        </>
    );
};
