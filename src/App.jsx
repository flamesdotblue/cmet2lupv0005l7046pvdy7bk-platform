import React, { useEffect, useMemo, useRef, useState } from "react";

// Simple POC: macOS-style About page for WhisperMac with icon, description, version,
// and Import/Export all settings actions. All UI/logic in this single file.

const APP_NAME = "WhisperMac";
const APP_TAGLINE = "Private, on‑device transcription and voice control for macOS.";
const VERSION = "1.3.2"; // For POC purposes; in a real app, inject from build
const STORAGE_KEY = "whispermac:settings";

const defaultSettings = {
  transcription: {
    model: "base.en",
    autoPunctuation: true,
    noiseSuppression: true,
    language: "en",
  },
  shortcuts: {
    pushToTalk: "⌥⌘Space",
    quickTranscribe: "⌃⌘T",
  },
  privacy: {
    analytics: false,
    shareCrashReports: false,
  },
  ui: {
    theme: "system",
    showMenuBarIcon: true,
  },
  updatedAt: new Date().toISOString(),
};

function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSettings;
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    } catch (e) {
      console.warn("Failed to parse settings, using defaults", e);
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to persist settings", e);
    }
  }, [settings]);

  const reset = () => setSettings({ ...defaultSettings, updatedAt: new Date().toISOString() });

  return { settings, setSettings, reset };
}

function AboutIcon({ size = 96 }) {
  // Circular macOS-style app icon with subtle gradient and a stylized waveform
  return (
    <div
      aria-hidden
      className="relative rounded-2xl shadow-inner"
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-2xl"
        style={{
          background:
            "conic-gradient(from 200deg at 50% 50%, #8b5cf6, #06b6d4, #10b981, #f59e0b, #ef4444, #8b5cf6)",
          filter: "saturate(85%)",
        }}
      />
      <div className="absolute inset-[2px] rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-sm" />
      <svg
        className="absolute inset-0 m-auto text-gray-900/90 dark:text-white/90"
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 100 100"
      >
        <path
          d="M10 55 Q20 35 30 55 T50 55 T70 55 T90 55"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.9"
        />
        <rect x="46" y="25" width="8" height="50" rx="4" fill="currentColor" opacity="0.9" />
      </svg>
    </div>
  );
}

function Dot({ color }) {
  return <span className={`inline-block h-3 w-3 rounded-full ${color}`} />;
}

function Toast({ kind = "success", message, onClose }) {
  const colors =
    kind === "success"
      ? "bg-emerald-500 text-white"
      : kind === "error"
      ? "bg-rose-500 text-white"
      : "bg-gray-800 text-white";
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 shadow-lg ${colors}`}>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default function App() {
  const { settings, setSettings, reset } = useSettings();
  const [toast, setToast] = useState({ kind: "success", message: "" });
  const fileInputRef = useRef(null);

  const prettyJSON = useMemo(() => JSON.stringify(settings, null, 2), [settings]);

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${APP_NAME.toLowerCase()}-settings.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ kind: "success", message: "Settings exported" });
    } catch (e) {
      console.error(e);
      setToast({ kind: "error", message: "Export failed" });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const merged = { ...defaultSettings, ...parsed, updatedAt: new Date().toISOString() };
      setSettings(merged);
      setToast({ kind: "success", message: "Settings imported" });
    } catch (err) {
      console.error(err);
      setToast({ kind: "error", message: "Invalid settings file" });
    } finally {
      e.target.value = ""; // allow re-upload of same file
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(40%_60%_at_100%_0%,rgba(16,185,129,0.14),transparent)] dark:bg-[radial-gradient(60%_80%_at_50%_-10%,rgba(99,102,241,0.22),transparent),radial-gradient(40%_60%_at_100%_0%,rgba(16,185,129,0.18),transparent)] text-gray-900 dark:text-gray-100 antialiased">
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="relative w-full max-w-xl">
          {/* macOS window chrome */}
          <div className="absolute -top-3 left-4 flex gap-2">
            <Dot color="bg-red-500" />
            <Dot color="bg-amber-400" />
            <Dot color="bg-emerald-500" />
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/30">
            <div className="flex flex-col items-center text-center gap-5">
              <AboutIcon />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{APP_TAGLINE}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-black/5 bg-white/60 px-2 py-1 dark:border-white/10 dark:bg-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Version {VERSION}</span>
                </span>
                <span className="select-none">•</span>
                <span className="rounded-full border border-black/5 bg-white/60 px-2 py-1 dark:border-white/10 dark:bg-white/10">Universal Binary</span>
              </div>

              <div className="mt-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={handleExport}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow md:active:translate-y-0 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80"><path fill="currentColor" d="M12 3v10.17l3.59-3.58L17 11l-5 5l-5-5l1.41-1.41L11 13.17V3h1z"/></svg>
                  Export All Settings
                </button>
                <button
                  onClick={handleImportClick}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-gradient-to-tr from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:shadow-md hover:brightness-110 md:active:brightness-100"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-90"><path fill="currentColor" d="M12 21V10.83l-3.59 3.58L7 13l5-5l5 5l-1.41 1.41L13 10.83V21h-1z"/></svg>
                  Import Settings
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => {
                    reset();
                    setToast({ kind: "success", message: "Settings reset" });
                  }}
                  className="underline-offset-4 hover:underline"
                >
                  Reset to defaults
                </button>
                <span aria-hidden>•</span>
                <span>Stored locally (no cloud sync)</span>
              </div>

              <details className="w-full select-text text-left">
                <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs text-gray-600 outline-none ring-indigo-500/40 hover:bg-black/5 focus:ring-2 dark:text-gray-300 dark:hover:bg-white/5">
                  View current settings JSON
                </summary>
                <pre className="mt-2 max-h-60 overflow-auto rounded-lg border border-black/10 bg-black/5 p-3 text-xs leading-relaxed dark:border-white/10 dark:bg-white/5">
{prettyJSON}
                </pre>
              </details>

              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} WhisperMac. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast kind={toast.kind} message={toast.message} onClose={() => setToast({ ...toast, message: "" })} />
    </div>
  );
}
