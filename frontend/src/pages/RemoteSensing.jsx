import React from 'react';
import { motion } from 'framer-motion';
import { Satellite, Wind, Mountain, Layers, BarChart } from 'lucide-react';

const RemoteSensing = () => {
    return (
        <div className="h-full overflow-y-auto bg-forest-900 text-white p-8">
            <div className="max-w-6xl mx-auto py-4">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">
                        Remote Sensing & <span className="text-forest-400">Analysis</span>
                    </h1>
                    <p className="text-forest-200 max-w-2xl text-lg">
                        Fusing high-resolution multispectral satellite imagery with topological datasets to identify systemic regional vulnerabilities.
                    </p>
                </div>

                {/* NDVI Explanation block */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl border-l-4 border-green-500 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="flex items-start gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-forest-800/80 flex items-center justify-center shrink-0 border border-forest-500/30">
                            <Satellite className="text-forest-400" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Normalized Difference Vegetation Index (NDVI)</h2>
                            <p className="text-forest-200 mb-4 max-w-3xl leading-relaxed">
                                NDVI quantifies vegetation by measuring the difference between near-infrared (which vegetation strongly reflects) and red light (which vegetation absorbs). We leverage <strong>NASA MODIS</strong> and <strong>Sentinel-2</strong> data pipelines to generate daily health scores for the IIT Mandi canopy.
                            </p>
                            <div className="inline-flex items-center gap-3 bg-forest-950/80 px-4 py-2 rounded-lg border border-forest-700/50 font-mono text-sm text-forest-300">
                                <span>Formula:</span>
                                <span className="font-bold text-white">NDVI = (NIR - Red) / (NIR + Red)</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Satellite Comparison Tool */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Layers className="text-forest-400" size={20} />
                        Temporal Canopy Change (2018 vs 2023)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 2018 Dummy Block */}
                        <div className="bg-forest-950/50 rounded-2xl border border-forest-800/50 overflow-hidden group">
                            <div className="h-64 bg-forest-800/30 relative flex items-center justify-center overflow-hidden">
                                <span className="text-forest-500 font-medium">Satellite Tile: 2018-09-14</span>
                                {/* Subtle green gradient simulating dense forest */}
                                <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-forest-800/40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"></div>
                            </div>
                            <div className="p-4 bg-forest-900 border-t border-forest-800/50 flex justify-between items-center">
                                <span className="font-bold text-lg">Pre-Construction Phase</span>
                                <span className="text-xs bg-forest-800 text-forest-300 px-2 py-1 rounded">Canopy Cover: 82%</span>
                            </div>
                        </div>

                        {/* 2023 Dummy Block */}
                        <div className="bg-forest-950/50 rounded-2xl border border-forest-800/50 overflow-hidden group">
                            <div className="h-64 bg-forest-800/30 relative flex items-center justify-center overflow-hidden">
                                <span className="text-forest-500 font-medium">Satellite Tile: 2023-09-15</span>
                                {/* Harsher gradient simulating broken canopy/infrastructure */}
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-forest-800/30 to-amber-900/40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"></div>
                            </div>
                            <div className="p-4 bg-forest-900 border-t border-forest-800/50 flex justify-between items-center">
                                <span className="font-bold text-lg">Post-Expansion Phase</span>
                                <span className="text-xs bg-alert-900/50 text-alert-400 border border-alert-800/50 px-2 py-1 rounded">Canopy Cover: 64%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Terrain Metrics */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Mountain className="text-forest-400" size={20} />
                        Terrain Vulnerability Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="glass-panel p-6 rounded-xl text-center">
                            <div className="w-12 h-12 rounded-full bg-forest-800 mx-auto flex items-center justify-center mb-4">
                                <BarChart className="text-forest-400" size={20} />
                            </div>
                            <h4 className="font-bold mb-1">Elevation Gradient</h4>
                            <p className="text-3xl font-bold text-white mb-2">1,200m</p>
                            <p className="text-xs text-forest-300">Mean height of highly susceptible target zones mapping directly to endemic pine belts.</p>
                        </div>

                        <div className="glass-panel p-6 rounded-xl text-center border-b-4 border-alert-500">
                            <div className="w-12 h-12 rounded-full bg-alert-900/50 border border-alert-800/50 mx-auto flex items-center justify-center mb-4">
                                <Mountain className="text-alert-400" size={20} />
                            </div>
                            <h4 className="font-bold mb-1">Critical Slopes (&gt;30°)</h4>
                            <p className="text-3xl font-bold text-alert-400 mb-2">42%</p>
                            <p className="text-xs text-forest-300">Percentage of monitored areas facing severe landslide risks if deforested.</p>
                        </div>

                        <div className="glass-panel p-6 rounded-xl text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-800/30 mx-auto flex items-center justify-center mb-4">
                                <Wind className="text-blue-400" size={20} />
                            </div>
                            <h4 className="font-bold mb-1">Hydrological Impact</h4>
                            <p className="text-3xl font-bold text-white mb-2">High</p>
                            <p className="text-xs text-forest-300">Deforestation in the upper catchments directly correlates to flood peaks in lower townships.</p>
                        </div>

                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default RemoteSensing;
