import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, TrendingUp, Calendar, MapPin, Search, Info, PenTool, RefreshCw } from 'lucide-react';
import CesiumMap from '../components/Map/CesiumMap';

const TREE_SPECIES = [
    { name: 'Mix', color: '#006400', id: 0 },
    { name: 'Kail', color: '#1f78b4', id: 1 },
    { name: 'Deodar', color: '#ff7f00', id: 2 },
    { name: 'Rai', color: '#6a3d9a', id: 3 },
    { name: 'Open', color: '#e31a1c', id: 4 },
    { name: 'Apple', color: '#ffd92f', id: 5 },
    { name: 'Mohr', color: '#17becf', id: 6 },
];

const InteractiveMap = () => {
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [activeZone, setActiveZone] = useState(null);
    const [layerOpacity, setLayerOpacity] = useState(0.7);
    const [geeLayerUrl, setGeeLayerUrl] = useState(null);
    const [showTrainingPoints, setShowTrainingPoints] = useState(true);
    const [trainingPoints, setTrainingPoints] = useState([]);
    
    // Polygon drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnPoints, setDrawnPoints] = useState([]);
    const [retraining, setRetraining] = useState(false);

    useEffect(() => {
        fetchLatestMap();
        fetchSurveyPoints();
    }, []);

    const fetchLatestMap = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/survey/latest-map');
            const data = await response.json();
            if (data.status === 'success' || data.status === 'mock') {
                setGeeLayerUrl(data.tile_fetch_url);
            }
        } catch (error) {
            console.error("Error fetching latest map:", error);
        }
    };

    const fetchSurveyPoints = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/survey/points');
            const data = await response.json();
            setTrainingPoints(data);
        } catch (error) {
            console.error("Error fetching survey points:", error);
        }
    };

    const handlePredictArea = async () => {
        if (drawnPoints.length < 3) {
            alert("Please draw a valid polygon first.");
            return;
        }
        setRetraining(true);
        try {
            const polygonCoords = drawnPoints.map(p => [p.lng, p.lat]);
            // Close the polygon implicitly matching GEE formats if not already closed
            if (polygonCoords.length > 0) {
               polygonCoords.push(polygonCoords[0]);
            }
            const response = await fetch('http://localhost:8000/v1/survey/retrain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ polygon: polygonCoords })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setGeeLayerUrl(result.tile_fetch_url);
            } else {
                alert(result.message || "Failed to predict area.");
            }
        } catch (error) {
            console.error("Error retraining model:", error);
            alert("Failed to predict on selected area.");
        }
        setRetraining(false);
        setIsDrawing(false);
        setDrawnPoints([]);
    };

    const handleMapClick = async (lat, lng) => {
        if (isDrawing) return;
        
        // Show loading state
        setActiveZone({ isLoading: true });
        
        try {
            const response = await fetch('http://localhost:8000/v1/analytics/species-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng })
            });
            const data = await response.json();
            setActiveZone(data);
        } catch (error) {
            console.error("Failed to fetch species data:", error);
            setActiveZone(null);
        }
    };

    return (
        <div className="w-full h-full relative flex bg-forest-950">
            {/* 3D Map Container */}
            <div className="flex-1 relative">
                <CesiumMap 
                    geeLayer={geeLayerUrl} 
                    layerOpacity={layerOpacity} 
                    trainingPoints={showTrainingPoints ? trainingPoints : []}
                    isDrawing={isDrawing}
                    drawnPoints={drawnPoints}
                    setDrawnPoints={setDrawnPoints}
                    onMapClick={handleMapClick}
                />

                {/* Floating Search/Action Bar */}
                <div className="absolute top-6 left-6 z-10 flex gap-4">
                    <div className="glass-panel px-4 py-2 flex items-center gap-2 bg-forest-900/90 w-64">
                        <Search size={16} className="text-forest-400" />
                        <input
                            type="text"
                            placeholder="Search zones or species..."
                            className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-forest-500"
                        />
                    </div>
                    <button
                        onClick={() => { setIsDrawing(!isDrawing); if (!isDrawing) setDrawnPoints([]); }}
                        className={`px-4 py-2 glass-panel flex items-center gap-2 transition-colors ${isDrawing ? 'bg-alert-600 border-alert-500' : 'bg-forest-900/90 hover:bg-forest-800'}`}
                    >
                        <PenTool size={16} className={isDrawing ? 'text-white' : 'text-forest-400'} />
                        <span className="text-sm font-medium">{isDrawing ? 'Drawing...' : 'Draw Area'}</span>
                    </button>
                    {drawnPoints.length >= 3 && !isDrawing && (
                        <button
                            onClick={handlePredictArea}
                            disabled={retraining}
                            className={`px-4 py-2 flex items-center gap-2 rounded-lg transition-colors border shadow-lg ${retraining ? 'bg-forest-800 border-forest-600/50' : 'bg-forest-600 border-forest-500 hover:bg-forest-500'}`}
                        >
                            <RefreshCw size={16} className={retraining ? 'animate-spin text-white' : 'text-white'} />
                            <span className="text-sm font-medium text-white">{retraining ? 'Predicting...' : 'Predict on Area'}</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowLayerMenu(!showLayerMenu)}
                        className={`px-4 py-2 glass-panel flex items-center gap-2 transition-colors ${showLayerMenu ? 'bg-forest-600' : 'bg-forest-900/90 hover:bg-forest-800'}`}
                    >
                        <Layers size={16} className={showLayerMenu ? 'text-white' : 'text-forest-300'} />
                        <span className="text-sm font-medium">Map Controls</span>
                    </button>
                </div>

                {/* Floating Layer Menu & Controls */}
                <AnimatePresence>
                    {showLayerMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-20 left-6 z-10 glass-panel p-5 w-80 bg-forest-950/95 border-forest-600/50 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-forest-400 uppercase tracking-wider">Classification Controls</h3>
                                <button onClick={() => setShowLayerMenu(false)}><X size={14} className="text-forest-500" /></button>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Opacity Control */}
                                <div>
                                    <div className="flex justify-between text-xs text-forest-300 mb-2 font-medium">
                                        <span>Layer Transparency</span>
                                        <span>{Math.round(layerOpacity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={layerOpacity}
                                        onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-forest-800 rounded-lg appearance-none cursor-pointer accent-forest-400"
                                    />
                                </div>

                                {/* Training Points Toggle */}
                                <button
                                    onClick={() => setShowTrainingPoints(!showTrainingPoints)}
                                    className="flex items-center justify-between w-full p-2 rounded-lg bg-forest-900/50 border border-forest-800/50 hover:bg-forest-800/50 transition-colors"
                                >
                                    <span className="text-sm text-forest-200">Show Training Points</span>
                                    <div className={`w-8 h-4 rounded-full p-1 transition-colors ${showTrainingPoints ? 'bg-forest-500' : 'bg-forest-800'}`}>
                                        <div className={`w-2 h-2 bg-white rounded-full transition-transform ${showTrainingPoints ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </button>

                                {/* Legend */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-forest-500 uppercase tracking-widest mb-3">Tree Species Legend</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TREE_SPECIES.map(species => (
                                            <div key={species.id} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: species.color }} />
                                                <span className="text-xs text-forest-300">{species.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-forest-800/50">
                                <div className="flex items-start gap-2 text-[10px] text-forest-500 leading-relaxed italic">
                                    <Info size={12} className="shrink-0 mt-0.5" />
                                    <span>Classification generated via Random Forest (Smile) on Sentinel-2 Seasonal Stack.</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Timeline Slider Overlay */}
                {/*<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 glass-panel px-6 py-3 bg-forest-950/90 w-full max-w-xl flex items-center gap-6">
                    <Calendar size={18} className="text-forest-400" />
                    <div className="flex-1">
                        <input
                            type="range"
                            min="2018"
                            max="2025"
                            defaultValue="2025"
                            className="w-full h-1 bg-forest-800 rounded-lg appearance-none cursor-pointer accent-forest-400"
                        />
                        <div className="flex justify-between text-[10px] text-forest-500 font-mono mt-1 font-bold">
                            <span>2018</span>
                            <span>2020</span>
                            <span>2022</span>
                            <span>2025</span>
                        </div>
                    </div>
                    <span className="text-xl font-bold font-mono text-white min-w-[50px]">2025</span>
                </div>*/}
            </div>

            {/* Right Sidebar - Region Intelligence */}
            <AnimatePresence>
                {activeZone && (
                    <motion.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className="w-96 bg-forest-950 border-l border-forest-800/50 flex flex-col h-full z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.3)] relative"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-forest-800/50 relative">
                            <button
                                onClick={() => setActiveZone(null)}
                                className="absolute top-4 right-4 text-forest-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-2 text-alert-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <MapPin size={12} />
                                {activeZone.isLoading ? 'Analyzing Region...' : 'Active Zone Profile'}
                            </div>
                            
                            {activeZone.isLoading ? (
                                <div className="h-8 bg-forest-800/50 rounded animate-pulse w-3/4 mb-2"></div>
                            ) : (
                                <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                                    {activeZone.name} Terrain
                                </h2>
                            )}

                            {!activeZone.isLoading && (
                                <div className="flex gap-2">
                                    <span className="bg-alert-900/50 text-alert-400 border border-alert-800/50 px-2 py-1 rounded text-xs font-medium">Risk: {activeZone.risk || 'Unknown'}</span>
                                    <span className="bg-forest-800/50 text-forest-300 border border-forest-700/50 px-2 py-1 rounded text-xs font-medium">Area: {activeZone.size || 'N/A'}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {activeZone.isLoading ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-20 bg-forest-900/50 rounded-xl animate-pulse"></div>
                                        <div className="h-20 bg-forest-900/50 rounded-xl animate-pulse"></div>
                                    </div>
                                    <div className="h-24 bg-forest-900/50 rounded-xl animate-pulse"></div>
                                    <div className="h-40 bg-forest-900/50 rounded-xl animate-pulse"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Description */}
                                    <div className="text-sm text-forest-300 leading-relaxed">
                                        {activeZone.description}
                                    </div>

                                    {/* Core Metrics */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-forest-900/50 border border-forest-800/50 p-4 rounded-xl">
                                            <p className="text-forest-400 text-xs font-medium mb-1 uppercase">Recorded Count</p>
                                            <p className="text-2xl font-bold text-white">{activeZone.totalSpecies}</p>
                                        </div>
                                        <div className="bg-forest-900/50 border border-forest-800/50 p-4 rounded-xl">
                                            <p className="text-forest-400 text-xs font-medium mb-1 uppercase">Last Survey</p>
                                            <p className="text-sm font-bold text-white mt-1">{activeZone.lastSurvey}</p>
                                        </div>
                                    </div>

                                    {/* Dominant Flora */}
                                    <div>
                                        <h3 className="text-sm font-bold text-forest-300 uppercase tracking-wider mb-3">Ecological Role</h3>
                                        <div className="bg-forest-900/50 border border-forest-800/50 p-4 rounded-xl text-sm text-white font-medium leading-relaxed">
                                            {activeZone.dominant}
                                        </div>
                                    </div>

                                    {/* Trend Graph */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-bold text-forest-300 uppercase tracking-wider">Density Trend</h3>
                                            <TrendingUp size={16} className="text-forest-500" />
                                        </div>
                                        <div className="h-32 bg-forest-900/30 border border-forest-800/50 rounded-xl flex items-end justify-between p-4 relative overflow-hidden">
                                            {/* Dynamic Bar Chart */}
                                            {activeZone.trend_data && activeZone.trend_data.map((val, i) => {
                                                const maxVal = Math.max(...activeZone.trend_data);
                                                const heightPct = (val / maxVal) * 100;
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(10, heightPct)}%` }}
                                                        transition={{ delay: i * 0.1, type: "spring" }}
                                                        className={`w-8 rounded-t-sm ${heightPct < 50 ? 'bg-alert-500/80' : 'bg-forest-500/80'}`}
                                                    />
                                                );
                                            })}

                                            {/* Gradient overlay for fade */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-forest-950/20 pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 bg-forest-700 hover:bg-forest-600 text-white text-sm font-bold rounded-xl transition-colors">
                                        Download Comprehensive Report
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveMap;
