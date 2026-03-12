import {
    ShieldAlert, Info, Star, Zap,
    MessageSquare, MessageCircle, Accessibility as AccessibilityIcon
} from "lucide-react";

// ── Predefined message catalog ────────────────────────────────────────────────
export const PREDEFINED_MESSAGES = [
    {
        category: "Safety",
        color: "#ef4444",
        icon: ShieldAlert,
        messages: [
            { pmid: 1, mid: 7101, timeout: 30, label: "Fasten Seatbelt", message: "Please make sure to be seated and fasten your seat belt tight and low, ensuring it is not twisted." },
            { pmid: 2, mid: 7102, timeout: 25, label: "Turbulence", message: "Please return to your seat and fasten your seatbelt. We are experiencing turbulence." },

        ]
    },
    {
        category: "Service",
        color: "#3b82f6",
        icon: Star,
        messages: [
            { pmid: 6, mid: 7201, timeout: 20, label: "Meal Service Soon", message: "Meal service will begin shortly. Please stow your tray table if it is currently open." },
            { pmid: 8, mid: 7203, timeout: 25, label: "Drink Service", message: "Drinks service is now available. Please press your call button if you would like to place an order." }
        ]
    },
    {
        category: "Flight Info",
        color: "#10b981",
        icon: Info,
        messages: [
            { pmid: 10, mid: 7301, timeout: 20, label: "Prepare for Landing", message: "We will be landing shortly. Please ensure your seat belt is fastened and all electronic devices are stowed." },
            { pmid: 11, mid: 7302, timeout: 20, label: "Cruising Altitude", message: "We have reached our cruising altitude. You may now use approved electronic devices in airplane mode." }
        ]
    },
    {
        category: "Entertainment",
        color: "#8b5cf6",
        icon: Zap,
        messages: [
            { pmid: 14, mid: 7401, timeout: 15, label: "IFE System Available", message: "Your in-flight entertainment system is now available. Enjoy your flight!" },
        ]
    },
];

// ── API base ──────────────────────────────────────────────────────────────────
export const getBaseUrl = () => `http://${window.location.hostname}:50603`;

// ── Message type definitions ──────────────────────────────────────────────────
export const MESSAGE_TYPES = [
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
    },
    {
        key: "accessibility",
        label: "Accessibility",
        subtitle: "Seat adjustments",
        typeCode: "11",
        Icon: AccessibilityIcon,
        accent: { border: "#f59e0b", glow: "rgba(245,158,11,0.25)", bg: "rgba(245,158,11,0.10)", icon: "#fcd34d", badge: "#78350f", text: "#fde68a" },
        description: "Control passenger accessibility features such as TTS, high contrast, text size, and color inversion.",
    }
];

export const defaultForms = {
    predefined: { pmid: "", timeout: "20", mid: "", message: "" },
    freetext: { timeout: "20", message: "" },
    connecting_gate: { timeout: "20", state: "ENABLE" },
    screensaver: { timeout: "20", state: "on" },
    wireless_custom: { timeout: "20", message: "" },
    accessibility: {
        timeout: "30",
        tts_state: "",
        descriptive_audio: "",
        font_size: "",
        high_contrast: "",
        screen_magnification: "",
        color_inversion: "",
        color_correction: "",
        color_correction_value: "",
        closed_caption: ""
    },
};

// ── Build API body ────────────────────────────────────────────────────────────
export const buildBody = (type, form) => {
    const timeout = form.timeout ? Number(form.timeout) : undefined;
    const base = { messageType: type, ...(timeout && { timeout }) };
    switch (type) {
        case "predefined": return { ...base, ...(form.pmid && { pmid: Number(form.pmid) }), ...(form.mid && { mid: Number(form.mid) }), message: form.message };
        case "freetext": return { ...base, message: form.message };
        case "connecting_gate": return { ...base, state: form.state };
        case "screensaver": return { ...base, state: form.state };
        case "wireless_custom": return { ...base, message: form.message };
        case "accessibility": {
            const settings = {};
            ['tts_state', 'descriptive_audio', 'font_size', 'high_contrast', 'screen_magnification', 'color_inversion', 'color_correction', 'color_correction_value', 'closed_caption'].forEach(k => {
                if (form[k]) settings[k] = form[k];
            });
            return { ...base, settings };
        }
        default: return base;
    }
};


