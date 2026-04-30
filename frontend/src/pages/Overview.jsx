import React from 'react';
import { motion } from 'framer-motion';
import { Mountain, Leaf, Shield, Cpu, Webhook, Radio, Database } from 'lucide-react';

const Overview = () => {
    return (
        <div className="h-full overflow-y-auto bg-forest-900 relative p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-forest-600/10 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-6xl mx-auto py-8">

                {/* Header Section */}
                <div className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-800/80 border border-forest-500/30 text-forest-300 text-sm font-medium mb-6"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Pilot Region: IIT Mandi Campus
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-white"
                    >
                        Safeguarding the <span className="bg-clip-text text-transparent bg-gradient-to-r from-forest-300 to-forest-500">Himalayas</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-forest-200 max-w-3xl leading-relaxed"
                    >
                        An advanced ecosystem leveraging edge ML, acoustic sensors, and real-time geospatial intelligence to detect illegal logging, monitor biodiversity, and protect fragile topography.
                    </motion.p>
                </div>

                {/* Triple Pillar Context */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-8 rounded-2xl border-t-4 border-forest-500"
                    >
                        <Mountain className="text-forest-400 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-white mb-3">Why the Himalayas Matter</h3>
                        <p className="text-forest-300 text-sm leading-relaxed">
                            Serving as the "water tower of Asia," the Himalayan ecosystem regulates climate patterns for over a billion people. Even localized deforestation cascades into massive downstream ecological failures.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-8 rounded-2xl border-t-4 border-alert-500"
                    >
                        <Leaf className="text-alert-400 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-white mb-3">IIT Mandi's Sensitivity</h3>
                        <p className="text-forest-300 text-sm leading-relaxed">
                            Nestled at the transition zone between lower and upper Himalayan ranges, the IIT Mandi region represents an incredibly dense, vulnerable pocket of endemic species heavily disrupted by recent infrastructural growth.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel p-8 rounded-2xl border-t-4 border-blue-500"
                    >
                        <Shield className="text-blue-400 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-white mb-3">The Core Problem</h3>
                        <p className="text-forest-300 text-sm leading-relaxed">
                            Traditional forest patrolling is highly reactive and manual. We are solving the "latency of response" by instituting continuous, autonomous, remote monitoring that catches acoustic signatures before a single tree falls.
                        </p>
                    </motion.div>
                </div>

                {/* System Architecture Diagram */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-forest-700/50">
                        <h2 className="text-3xl font-bold text-white">System Architecture</h2>
                        <span className="text-sm text-forest-400 font-mono bg-forest-800/50 px-3 py-1 rounded-md">v2.4 Core Services</span>
                    </div>

                    {/* Diagram Layout */}
                    <div className="bg-forest-950/50 rounded-3xl p-6 md:p-10 border border-forest-700/50 relative overflow-hidden">

                        {/* Lines/Arrows (Simulated via SVG) - Now with animated dashes */}
                        <svg className="absolute inset-0 w-full h-full text-forest-500 pointer-events-none hidden md:block" xmlns="http://www.w3.org/2000/svg">

                            {/* Hardware to Cloud */}
                            <line x1="25%" y1="36%" x2="50%" y2="36%" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6"
                                className="animate-[dash_20s_linear_infinite]" />

                            {/* Cloud to Ops */}
                            <line x1="50%" y1="36%" x2="75%" y2="36%" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6"
                                className="animate-[dash_20s_linear_infinite]" />

                            {/* Cloud to Database */}
                            <line x1="50%" y1="36%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6"
                                className="animate-[dash_20s_linear_infinite]" />
                        </svg>

                        {/* Add a global style just for this animation within this component */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
               @keyframes dash {
                 to {
                   stroke-dashoffset: -1000;
                 }
               }
             `}} />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 w-full max-w-5xl mx-auto">

                            {/* Hardware Edge Layer */}
                            <div className="flex flex-col items-center justify-start">
                                <div className="w-16 h-16 rounded-full bg-forest-800 border border-forest-500 flex items-center justify-center mb-4 z-10 shadow-[0_0_20px_rgba(42,99,68,0.5)]">
                                    <Radio className="text-forest-300" size={24} />
                                </div>
                                <div className="glass-panel p-5 rounded-xl border-dashed border-forest-500/50 text-center w-full max-w-[240px]">
                                    <h4 className="font-bold text-white mb-1">Hardware Edge</h4>
                                    <p className="text-xs text-forest-300 mb-2">Solar Acoustic Nodes</p>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        <span className="text-[10px] bg-forest-800 px-2 py-1 rounded text-forest-200">TinyML</span>
                                        <span className="text-[10px] bg-forest-800 px-2 py-1 rounded text-forest-200">LoRaWAN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cloud & ML Backend */}
                            <div className="flex flex-col items-center justify-start">
                                <div className="w-16 h-16 rounded-full bg-blue-900/50 border border-blue-500 flex items-center justify-center mb-4 z-10 shadow-[0_0_20px_rgba(59,130,246,0.5)] relative">
                                    <Cpu className="text-blue-300" size={24} />
                                    {/* Tiny visual pulse ring */}
                                    <div className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-20"></div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl text-center w-full max-w-[240px] relative bg-blue-950/20 border-blue-500/30">
                                    <h4 className="font-bold text-white mb-1">Cloud Inference</h4>
                                    <p className="text-xs text-blue-200 mb-2">FastAPI + ONNX Runtime</p>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        <span className="text-[10px] bg-blue-900/50 px-2 py-1 rounded text-blue-200">Audio FFT</span>
                                        <span className="text-[10px] bg-blue-900/50 px-2 py-1 rounded text-blue-200">PostGIS</span>
                                    </div>
                                </div>
                            </div>

                            {/* Frontend / Ops */}
                            <div className="flex flex-col items-center justify-start">
                                <div className="w-16 h-16 rounded-full bg-alert-900/50 border border-alert-500 flex items-center justify-center mb-4 z-10 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                    <Webhook className="text-alert-300" size={24} />
                                </div>
                                <div className="glass-panel p-5 rounded-xl text-center w-full max-w-[240px] border-alert-500/30 bg-alert-950/10">
                                    <h4 className="font-bold text-white mb-1">Ops & Dispatch</h4>
                                    <p className="text-xs text-alert-200 mb-2">React + WebSockets</p>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        <span className="text-[10px] bg-alert-900/50 px-2 py-1 rounded text-alert-200">CesiumJS</span>
                                        <span className="text-[10px] bg-alert-900/50 px-2 py-1 rounded text-alert-200">Twilio SMS</span>
                                        <span className="text-[10px] bg-alert-900/50 px-2 py-1 rounded text-alert-200">Ranger</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Database / State store at the bottom */}
                        <div className="mt-16 flex justify-center w-full relative z-10">
                            <div className="glass-panel py-3 px-6 rounded-full border border-forest-600/50 flex flex-row items-center justify-center gap-4 bg-forest-900/90 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <Database size={16} className="text-forest-400 shrink-0" />
                                <span className="text-xs font-mono text-forest-300 text-center">PostgreSQL Vector DB & Redis PubSub</span>
                            </div>
                        </div>

                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default Overview;
