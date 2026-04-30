import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Target, ShieldPlus, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const SHAP_DATA = [
    { feature: 'Dist to Roads', importance: 0.85 },
    { feature: 'Canopy Density', importance: 0.62 },
    { feature: 'Historical Disturbance', importance: 0.55 },
    { feature: 'Elevation', importance: 0.35 },
    { feature: 'Slope', importance: 0.20 },
];

const RiskModels = () => {
    return (
        <div className="h-full overflow-y-auto bg-forest-900 text-white p-8">
            <div className="max-w-6xl mx-auto py-4">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">
                        Risk Prediction & <span className="text-alert-400">AI Models</span>
                    </h1>
                    <p className="text-forest-200 max-w-2xl text-lg">
                        Transparent breakdown of the machine learning ensembles driving our geospatial risk profiles and acoustic detection systems.
                    </p>
                </div>

                {/* Model Pipeline Explanation */}
                <div className="glass-panel p-8 rounded-2xl mb-12 relative overflow-hidden bg-forest-950/80">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-forest-600/10 blur-[100px] rounded-full"></div>

                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <BrainCircuit className="text-forest-400" size={28} />
                        Multimodal Risk Assessment Ensemble
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="border-l-2 border-forest-500 pl-4">
                            <h4 className="text-forest-300 text-xs uppercase font-bold tracking-wider mb-2">Stage 1: Inputs</h4>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 bg-forest-500 rounded-full"></div> Distance to road networks</li>
                                <li className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 bg-forest-500 rounded-full"></div> Historical Human Proximity</li>
                                <li className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 bg-forest-500 rounded-full"></div> Canopy Density (NDVI)</li>
                                <li className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 bg-forest-500 rounded-full"></div> Topographical Features</li>
                            </ul>
                        </div>

                        <div className="border-l-2 border-blue-500 pl-4">
                            <h4 className="text-blue-300 text-xs uppercase font-bold tracking-wider mb-2">Stage 2: Architecture</h4>
                            <p className="text-sm text-forest-200 leading-relaxed">
                                We utilize an optimized <strong>Random Forest Regressor</strong> combined with deep learning acoustic vectors. The model computes complex non-linear spatial relationships to dynamically weigh vulnerabilities.
                            </p>
                        </div>

                        <div className="border-l-2 border-alert-500 pl-4 bg-alert-900/10 p-4 rounded-r-xl">
                            <h4 className="text-alert-300 text-xs uppercase font-bold tracking-wider mb-2">Stage 3: Output</h4>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Global Risk Score:</span>
                                <span className="font-mono bg-alert-500 text-white px-2 py-0.5 rounded text-xs font-bold">0.82 / 1.0</span>
                            </div>
                            <p className="text-xs text-alert-200/70">
                                Used directly by the IIT Mandi Ranger dispatch protocols to prioritize physical patrol routes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feature Importance Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

                    {/* Chart Container */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <Target className="text-forest-400" size={20} />
                            Feature Importance (SHAP Values)
                        </h3>
                        <p className="text-xs text-forest-300 mb-6">Quantifying which variables most heavily influence illegal logging probability.</p>

                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={SHAP_DATA} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2A4A38" horizontal={false} />
                                    <XAxis type="number" stroke="#87B090" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="feature" type="category" stroke="#87B090" tick={{ fontSize: 12, fill: '#E2E8F0' }} width={120} />
                                    <Tooltip
                                        cursor={{ fill: '#1f4830' }}
                                        contentStyle={{ backgroundColor: '#0A1A10', border: '1px solid #2A4A38', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="importance" fill="#388358" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Inference Sample */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border border-forest-700/50">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-alert-400" size={20} />
                            Real-Time Inference Sample
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-forest-950 p-4 rounded-xl border border-forest-800 flex justify-between items-center group hover:border-forest-500 transition-colors">
                                <div>
                                    <p className="font-bold text-sm text-white">Sector 4A Inference</p>
                                    <p className="text-xs text-forest-400 font-mono mt-1">LAT: 31.7820, LNG: 76.9912</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-alert-500">89%</span>
                                    <span className="text-[10px] uppercase tracking-wide text-forest-300">Vulnerability</span>
                                </div>
                            </div>

                            <div className="bg-forest-950 p-4 rounded-xl border border-forest-800 flex justify-between items-center group hover:border-forest-500 transition-colors">
                                <div>
                                    <p className="font-bold text-sm text-white">Valley Pass Ecozone</p>
                                    <p className="text-xs text-forest-400 font-mono mt-1">LAT: 31.7501, LNG: 77.0125</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-warning-400 text-yellow-500">45%</span>
                                    <span className="text-[10px] uppercase tracking-wide text-forest-300">Vulnerability</span>
                                </div>
                            </div>

                            <div className="bg-forest-950 p-4 rounded-xl border border-forest-800 flex justify-between items-center group hover:border-forest-500 transition-colors">
                                <div>
                                    <p className="font-bold text-sm text-white">Campus Inner Core</p>
                                    <p className="text-xs text-forest-400 font-mono mt-1">LAT: 31.7755, LNG: 76.9880</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-forest-400">12%</span>
                                    <span className="text-[10px] uppercase tracking-wide text-forest-300">Vulnerability</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

export default RiskModels;
