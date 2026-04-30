import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Server, Battery, Radio, Settings2, Activity, Play, Pause, AlertTriangle, CheckCircle, Volume2 } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Folder path is resolved on the backend; the frontend fetches via these endpoints.
// Backend must expose:
//   GET /v1/audio/stream       → serves the audio.wav file (with proper headers)
//   GET /v1/audio/file-info    → returns JSON { last_modified: <epoch_ms> }
const AUDIO_STREAM_URL  = "http://127.0.0.1:8000/v1/audio/stream";
const AUDIO_INFO_URL    = "http://127.0.0.1:8000/v1/audio/file-info";
const FILE_POLL_MS      = 3000;   // how often to check if audio.wav changed
// ─────────────────────────────────────────────────────────────────────────────

const DeviceDashboard = () => {
    const [streamData, setStreamData] = useState(
        Array.from({ length: 50 }, (_, i) => ({ time: i, amplitude: 0 }))
    );
    const [logs, setLogs] = useState([{
        id: 1,
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        src: 'System',
        event: 'Dashboard UI Initialized.',
        level: 'info'
    }]);
    const [telemetry, setTelemetry] = useState({
        device_id: "Basestation-Alpha",
        label: "Normal",
        confidence: 0,
        battery: 100,
        network: "Stable"
    });
    const [wsStatus, setWsStatus] = useState("Disconnected");

    // ── Audio state ──────────────────────────────────────────────────────────
    const [isPlaying,    setIsPlaying]    = useState(false);
    const [audioReady,   setAudioReady]   = useState(false);   // file loaded OK
    const [audioError,   setAudioError]   = useState(null);    // fetch/decode error
    const [audioLabel,   setAudioLabel]   = useState("audio.wav");  // shown in UI

    // Web Audio refs
    const audioCtxRef    = useRef(null);
    const analyserRef    = useRef(null);
    const sourceRef      = useRef(null);   // AudioBufferSourceNode (current playback)
    const audioBufferRef = useRef(null);   // decoded AudioBuffer
    const startTimeRef   = useRef(0);      // AudioContext time when playback started
    const offsetRef      = useRef(0);      // playback offset for pause/resume
    const rafRef         = useRef(null);   // requestAnimationFrame id

    // Canvas ref for the visualiser
    const canvasRef      = useRef(null);

    // File-watching ref
    const lastModifiedRef = useRef(null);
    // Keep latest threat label in a ref so drawVisualiser never goes stale
    const labelRef = useRef(telemetry.label);
    useEffect(() => { labelRef.current = telemetry.label; }, [telemetry.label]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const addLog = useCallback((src, event, level) => {
        setLogs(prev => [{
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            src, event, level
        }, ...prev].slice(0, 50));
    }, []);

    // ── Ensure AudioContext ───────────────────────────────────────────────────
    // Must be called inside a user-gesture handler (click) so the browser allows it.
    const ensureCtx = useCallback(async () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Always await resume — it's a no-op if already running
        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }
        if (!analyserRef.current) {
            const analyser = audioCtxRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyser.connect(audioCtxRef.current.destination);
            analyserRef.current = analyser;
        }
    }, []);

    // ── Load / reload audio.wav from backend ─────────────────────────────────
    // NOTE: We do NOT call ensureCtx here — AudioContext must be created inside
    // a user gesture. We just fetch + store the raw ArrayBuffer, then decode
    // it lazily inside playAudio once the context exists.
    const rawBufRef = useRef(null);   // raw ArrayBuffer before decode

    const loadAudio = useCallback(async (silent = false) => {
        try {
            const res = await fetch(`${AUDIO_STREAM_URL}?t=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            rawBufRef.current = await res.arrayBuffer();
            // If context already exists (user has pressed play before), decode now
            if (audioCtxRef.current) {
                audioBufferRef.current = await audioCtxRef.current.decodeAudioData(
                    rawBufRef.current.slice(0)   // slice so buffer stays reusable
                );
            }
            setAudioReady(true);
            setAudioError(null);
            if (!silent) {
                addLog("AudioEngine", "audio.wav loaded successfully", "info");
                setAudioLabel("audio.wav ✓");
            }
        } catch (err) {
            setAudioReady(false);
            setAudioError(err.message);
            addLog("AudioEngine", `Failed to load audio.wav: ${err.message}`, "warn");
        }
    }, [addLog]);

    // ── Initial audio load on mount ───────────────────────────────────────────
    useEffect(() => {
        loadAudio(false);
    }, [loadAudio]);

    // ── File-watching poll ────────────────────────────────────────────────────
    useEffect(() => {
        const poll = async () => {
            try {
                const res  = await fetch(AUDIO_INFO_URL);
                if (!res.ok) return;
                const info = await res.json();
                const lm   = info.last_modified;
                if (lastModifiedRef.current !== null && lm !== lastModifiedRef.current) {
                    addLog("FileWatcher", "audio.wav changed on disk — reloading…", "info");
                    // Stop current playback before reload
                    if (isPlaying) stopAudio();
                    setAudioLabel("audio.wav ↻");
                    await loadAudio(true);
                    addLog("FileWatcher", "audio.wav hot-reloaded", "info");
                    setAudioLabel("audio.wav ✓");
                }
                lastModifiedRef.current = lm;
            } catch (_) { /* backend not yet ready, ignore */ }
        };
        const id = setInterval(poll, FILE_POLL_MS);
        poll(); // run immediately
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, loadAudio, addLog]);

    // ── Stop current source node ──────────────────────────────────────────────
    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (_) {}
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        cancelAnimationFrame(rafRef.current);
        // Clear canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        offsetRef.current = 0;
        setIsPlaying(false);
    }, []);

    // ── Draw visualiser frame ─────────────────────────────────────────────────
    const drawVisualiser = useCallback(() => {
        const analyser = analyserRef.current;
        const canvas   = canvasRef.current;
        if (!analyser || !canvas) return;

        const ctx        = canvas.getContext('2d');
        const bufferLen  = analyser.frequencyBinCount;
        const dataArray  = new Uint8Array(bufferLen);
        analyser.getByteFrequencyData(dataArray);

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const isThreatNow = telemetry.label.toLowerCase() === 'chainsaw';
        const barColor    = isThreatNow ? '#ef4444' : '#16a34a';
        const glowColor   = isThreatNow ? 'rgba(239,68,68,0.35)' : 'rgba(22,163,74,0.35)';

        const barW    = (W / bufferLen) * 2.5;
        let   x       = 0;

        for (let i = 0; i < bufferLen; i++) {
            const barH = (dataArray[i] / 255) * H;

            // Glow effect
            ctx.shadowBlur  = 8;
            ctx.shadowColor = glowColor;

            // Gradient bar
            const grad = ctx.createLinearGradient(0, H - barH, 0, H);
            grad.addColorStop(0, barColor);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(x, H - barH, barW - 1, barH);

            x += barW + 1;
            if (x > W) break;
        }

        rafRef.current = requestAnimationFrame(drawVisualiser);
    }, [telemetry.label]);

    // ── Play ──────────────────────────────────────────────────────────────────
    const playAudio = useCallback(async () => {
        // ensureCtx MUST run inside user-gesture (this is called from onClick)
        await ensureCtx();

        // Decode the raw buffer now if we haven't yet (first play ever)
        if (!audioBufferRef.current && rawBufRef.current) {
            try {
                audioBufferRef.current = await audioCtxRef.current.decodeAudioData(
                    rawBufRef.current.slice(0)
                );
            } catch (err) {
                addLog("AudioEngine", `Decode failed: ${err.message}`, "warn");
                return;
            }
        }
        if (!audioBufferRef.current) return;

        const src = audioCtxRef.current.createBufferSource();
        src.buffer = audioBufferRef.current;
        src.connect(analyserRef.current);
        src.start(0, offsetRef.current % audioBufferRef.current.duration);
        src.onended = () => {
            if (sourceRef.current === src) {
                offsetRef.current = 0;
                setIsPlaying(false);
                cancelAnimationFrame(rafRef.current);
            }
        };
        startTimeRef.current = audioCtxRef.current.currentTime - offsetRef.current;
        sourceRef.current    = src;
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(drawVisualiser);
    }, [ensureCtx, drawVisualiser, addLog]);

    // ── Pause ─────────────────────────────────────────────────────────────────
    const pauseAudio = useCallback(() => {
        if (!sourceRef.current) return;
        offsetRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
        try { sourceRef.current.stop(); } catch (_) {}
        sourceRef.current.disconnect();
        sourceRef.current = null;
        cancelAnimationFrame(rafRef.current);
        setIsPlaying(false);
    }, []);

    // ── Toggle ────────────────────────────────────────────────────────────────
    const togglePlay = useCallback(() => {
        if (isPlaying) pauseAudio();
        else            playAudio();   // playAudio is async but we don't need to await in handler
    }, [isPlaying, pauseAudio, playAudio]);

    // ── Resize canvas to match container ─────────────────────────────────────
    // offsetWidth/Height can be 0 before first paint; getBoundingClientRect is reliable.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const setSize = () => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width  = Math.round(rect.width);
                canvas.height = Math.round(rect.height);
            }
        };
        // Set immediately, then watch for layout changes
        setSize();
        const ro = new ResizeObserver(setSize);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

    // ── Redraw color when threat label changes ────────────────────────────────
    useEffect(() => {
        if (isPlaying) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(drawVisualiser);
        }
    }, [telemetry.label, isPlaying, drawVisualiser]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => () => {
        cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
    }, []);

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const ws = new WebSocket("ws://127.0.0.1:8000/v1/ws/device-data");

        ws.onopen = () => {
            setWsStatus("Connected");
            addLog("System", "WebSocket Connected to Basestation Stream", "info");
        };
        ws.onclose = () => {
            setWsStatus("Disconnected");
            addLog("System", "WebSocket Connection Lost", "warn");
        };
        ws.onerror = () => {
            setWsStatus("Error");
            addLog("System", "WebSocket Connection Error", "critical");
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setTelemetry(prev => ({
                    ...prev,
                    device_id:  data.device_id  ?? prev.device_id,
                    label:      data.label      ?? prev.label,
                    confidence: data.confidence ?? prev.confidence,
                    battery:    data.battery    ?? prev.battery,
                }));
                if (data.amplitude !== undefined) {
                    setStreamData(prev => {
                        const next = prev.slice(1);
                        next.push({ time: Date.now(), amplitude: data.amplitude });
                        return next;
                    });
                }
                if (data.label && data.label.toLowerCase() !== 'normal') {
                    const isThreat = data.label.toLowerCase() === 'chainsaw';
                    addLog(
                        data.device_id || "Basestation-Alpha",
                        `Acoustic Event: ${data.label.toUpperCase()} (${data.confidence.toFixed(1)}%)`,
                        isThreat ? "critical" : "warn"
                    );
                }
            } catch (err) {
                console.error("Error parsing websocket message", err);
            }
        };

        return () => ws.close();
    }, [addLog]);

    // ── Derived UI state ──────────────────────────────────────────────────────
    const isThreat      = telemetry.label.toLowerCase() === 'chainsaw';
    const labelColorClass = isThreat
        ? "text-alert-400"
        : (telemetry.label.toLowerCase() !== 'normal' ? "text-yellow-400" : "text-green-400");
    const labelBgClass = isThreat
        ? "bg-alert-900/40 border-alert-600/50"
        : (telemetry.label.toLowerCase() !== 'normal'
            ? "bg-yellow-900/40 border-yellow-600/50"
            : "bg-green-900/20 border-green-700/50");

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="h-full overflow-y-auto bg-forest-900 text-white p-8">
            <div className="max-w-6xl mx-auto py-4">

                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white flex items-center gap-3">
                            <Server className="text-forest-400" size={32} />
                            Guardian Device <span className="text-alert-400">Dashboard</span>
                        </h1>
                        <p className="text-forest-200 text-sm">
                            Real-time edge telemetry, acoustic log tailing, and hardware vitals for {telemetry.device_id}.
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className={`flex gap-2 items-center px-4 py-2 border rounded-lg ${wsStatus === 'Connected' ? 'bg-forest-800/80 border-forest-600/50' : 'bg-red-900/50 border-red-500/50'}`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${wsStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-mono font-bold">STREAM {wsStatus.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                {/* Top Hardware Vitals */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-5 rounded-2xl border-l-4 border-green-500 flex items-center justify-between">
                        <div>
                            <h4 className="text-xs text-forest-300 uppercase tracking-wider font-bold mb-1">Fleet Uptime</h4>
                            <p className="text-2xl font-bold font-mono">99.98%</p>
                        </div>
                        <Activity className="text-green-500 opacity-50" size={32} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="glass-panel p-5 rounded-2xl border-l-4 border-yellow-500 flex items-center justify-between">
                        <div>
                            <h4 className="text-xs text-forest-300 uppercase tracking-wider font-bold mb-1">Base Battery</h4>
                            <p className="text-2xl font-bold font-mono text-yellow-500">{telemetry.battery}%</p>
                        </div>
                        <Battery className="text-yellow-500 opacity-50" size={32} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="glass-panel p-5 rounded-2xl border-l-4 border-blue-500 flex items-center justify-between flex-1 md:col-span-2">
                        <div className="flex gap-8 w-full justify-between items-center">
                            <div>
                                <h4 className="text-xs text-forest-300 uppercase tracking-wider font-bold mb-1">Network Status</h4>
                                <p className="text-lg font-bold">LoRaWAN/WiFi <span className="text-blue-400">Stable</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-forest-300 mb-1">Device ID</p>
                                <p className="font-mono text-sm">{telemetry.device_id}</p>
                            </div>
                            <Radio className="text-blue-500 opacity-50 shrink-0" size={32} />
                        </div>
                    </motion.div>
                </div>

                {/* Dashboard Core Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                    {/* Live Classification Result */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                        className={`glass-panel rounded-2xl border p-8 flex flex-col items-center justify-center text-center shadow-xl ${labelBgClass}`}>
                        <div className="mb-4">
                            {isThreat
                                ? <AlertTriangle size={64} className="text-alert-500 animate-pulse" />
                                : telemetry.label.toLowerCase() !== 'normal'
                                    ? <Volume2 size={64} className="text-yellow-500" />
                                    : <CheckCircle size={64} className="text-green-500" />
                            }
                        </div>
                        <h4 className="text-sm uppercase tracking-widest text-forest-200 mb-2 font-bold opacity-80">Latest Classification</h4>
                        <h2 className={`text-5xl font-extrabold uppercase tracking-tight mb-2 ${labelColorClass}`}>
                            {telemetry.label}
                        </h2>
                        {telemetry.label.toLowerCase() === 'normal' && (
                            <p className="mt-2 text-sm text-green-300 opacity-70">Awaiting acoustic anomalies...</p>
                        )}
                    </motion.div>

                    {/* ── Acoustic Waveform Stream (with audio player + visualiser) ── */}
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                        className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden border border-forest-700/50 flex flex-col h-[350px]">

                        {/* Panel header */}
                        <div className="bg-forest-950 p-4 border-b border-forest-800 flex justify-between items-center shrink-0">
                            <h3 className="font-bold flex items-center gap-2">
                                <Play size={16} className="text-forest-400" />
                                Real-Time Acoustic Envelope
                            </h3>

                            {/* ── Play / Pause control ── */}
                            <div className="flex items-center gap-3">
                                {/* File label */}
                                <span className={`text-xs font-mono px-2 py-1 rounded border ${
                                    audioError
                                        ? 'text-red-400 border-red-700 bg-red-900/30'
                                        : audioReady
                                            ? 'text-forest-300 border-forest-700 bg-forest-900'
                                            : 'text-forest-500 border-forest-800 bg-forest-950'
                                }`}>
                                    {audioError ? `⚠ ${audioError}` : audioLabel}
                                </span>

                                {/* Play / Pause button */}
                                <button
                                    onClick={togglePlay}
                                    disabled={!audioReady}
                                    title={isPlaying ? "Pause" : "Play audio.wav"}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all
                                        ${!audioReady
                                            ? 'opacity-30 cursor-not-allowed border-forest-700 text-forest-500'
                                            : isPlaying
                                                ? 'bg-red-900/50 border-red-600/60 text-red-300 hover:bg-red-800/60'
                                                : 'bg-green-900/50 border-green-600/60 text-green-300 hover:bg-green-800/60'
                                        }`}
                                >
                                    {isPlaying
                                        ? <><Pause size={13} /> PAUSE</>
                                        : <><Play  size={13} /> PLAY</>
                                    }
                                </button>

                                <span className="text-xs font-mono text-forest-400 bg-forest-900 px-2 py-1 rounded border border-forest-800">
                                    STREAM: WEBSOCKET
                                </span>
                            </div>
                        </div>

                        {/* Chart + canvas visualiser stacked */}
                        <div className="flex-1 p-4 bg-forest-900/30 relative overflow-hidden">

                            {/* Recharts waveform (WebSocket amplitude) */}
                            <ResponsiveContainer width="100%" height="100%">
                                {/* <LineChart data={streamData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f4830" vertical={false} />
                                    <YAxis domain={[-10, 110]} stroke="#388358" tick={{ fontSize: 10 }} hide />
                                    <Line
                                        type="monotone"
                                        dataKey="amplitude"
                                        stroke={isThreat ? "#ef4444" : "#16a34a"}
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart> */}
                            </ResponsiveContainer>

                            {/* Canvas for Web Audio frequency-bar visualiser
                                Positioned at the bottom half so it overlays without
                                obscuring the Recharts line near the top.               */}
                            <canvas
                                ref={canvasRef}
                                className="absolute bottom-0 left-0 w-full pointer-events-none"
                                style={{
                                    height: '55%',
                                    opacity: isPlaying ? 0.82 : 0,
                                    transition: 'opacity 0.4s ease',
                                    mixBlendMode: 'screen',   // blends nicely over the dark panel
                                }}
                            />

                            {/* "No audio" hint when idle */}
                            {!isPlaying && audioReady && (
                                <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
                                    <span className="text-xs font-mono text-forest-500 opacity-60">
                                        ▶ Press PLAY to visualise audio.wav
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Edge Logs Terminal */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="glass-panel rounded-2xl border border-forest-700/50 flex flex-col h-[300px]">
                    <div className="bg-forest-950 p-4 border-b border-forest-800 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2">
                            <Settings2 size={16} className="text-forest-400" />
                            Live Edge Tailing
                        </h3>
                    </div>
                    <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-xs flex flex-col gap-2">
                        {logs.map(log => (
                            <div key={log.id} className="border-b border-forest-900/50 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-500">[{log.time}]</span>
                                    <span className="text-blue-400 font-bold">{log.src}</span>
                                </div>
                                <p className={`pl-2 border-l-2 ${
                                    log.level === 'critical'
                                        ? 'text-alert-500 border-alert-500 font-bold'
                                        : log.level === 'warn'
                                            ? 'text-yellow-500 border-yellow-500'
                                            : 'text-forest-300 border-forest-700'
                                }`}>
                                    {log.event}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default DeviceDashboard;