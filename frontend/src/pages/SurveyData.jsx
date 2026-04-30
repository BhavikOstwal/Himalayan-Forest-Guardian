import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Filter, Map, Activity, Search, RefreshCw, Plus, X, Upload, CheckCircle2, Calendar } from 'lucide-react';

const SurveyData = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [surveyData, setSurveyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMethod, setAddMethod] = useState('manual'); 
    
    // Manual Form State
    const [formData, setFormData] = useState({ 
        lat: '', lng: '', species_type: '', no: '', 
        loc: '', zone: '', notes: '', date: new Date().toISOString().split('T')[0] 
    });
    const [submitting, setSubmitting] = useState(false);

    // CSV State
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchSurveyData();
    }, []);

    const fetchSurveyData = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/survey/points');
            const data = await response.json();
            setSurveyData(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching survey data:", error);
            setLoading(false);
        }
    };

    const handleAddPoint = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/v1/survey/add-point', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: parseFloat(formData.lat),
                    lng: parseFloat(formData.lng),
                    species_type: formData.species_type,
                    no: parseInt(formData.no),
                    loc: formData.loc || null,
                    zone: formData.zone || null,
                    notes: formData.notes || null,
                    date: formData.date || null
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setShowAddModal(false);
                setFormData({ 
                    lat: '', lng: '', species_type: '', no: '', 
                    loc: '', zone: '', notes: '', date: new Date().toISOString().split('T')[0] 
                });
                fetchSurveyData();
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("Failed to add point.");
        }
        setSubmitting(false);
    };

    const handleCsvUpload = async () => {
        if (!file) return;
        setSubmitting(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/v1/survey/upload-csv', {
                method: 'POST',
                body: uploadFormData,
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert(result.message);
                setShowAddModal(false);
                setFile(null);
                fetchSurveyData();
            } else {
                alert(result.detail || result.message);
            }
        } catch (error) {
            alert("Failed to upload CSV.");
        }
        setSubmitting(false);
    };

    const filteredData = surveyData.filter(row =>
        row.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.loc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.zone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto bg-forest-900 text-white p-8">
            <div className="max-w-6xl mx-auto py-4">

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">
                            Survey & <span className="text-forest-400">Field Data</span>
                        </h1>
                        <p className="text-forest-200 max-w-2xl text-lg">
                            Transparent access to our ecological ground-truth datasets. All model predictions are validated against these rigorous field methodologies.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-forest-800 hover:bg-forest-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-forest-600/50"
                        >
                            <Plus size={16} />
                            Add Survey Points
                        </button>
                    </div>
                </div>

                {/* Add Point Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-forest-950 border border-forest-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-forest-800 flex justify-between items-center text-white">
                                    <h2 className="text-xl font-bold">Add Survey Data</h2>
                                    <button onClick={() => setShowAddModal(false)}><X size={20} className="text-forest-500" /></button>
                                </div>
                                
                                <div className="p-6 text-white overflow-y-auto max-h-[80vh]">
                                    {/* Tabs */}
                                    <div className="flex bg-forest-900 rounded-lg p-1 mb-6">
                                        <button 
                                            onClick={() => setAddMethod('manual')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${addMethod === 'manual' ? 'bg-forest-700 text-white' : 'text-forest-400 hover:text-white'}`}
                                        >
                                            Manual Entry
                                        </button>
                                        <button 
                                            onClick={() => setAddMethod('csv')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${addMethod === 'csv' ? 'bg-forest-700 text-white' : 'text-forest-400 hover:text-white'}`}
                                        >
                                            CSV Upload
                                        </button>
                                    </div>

                                    {addMethod === 'manual' ? (
                                        <form onSubmit={handleAddPoint} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Latitude *</label>
                                                    <input 
                                                        required type="number" step="any" placeholder="31.9..."
                                                        value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Longitude *</label>
                                                    <input 
                                                        required type="number" step="any" placeholder="77.0..."
                                                        value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Species Type *</label>
                                                    <input 
                                                        required type="text" placeholder="e.g. Deodar"
                                                        value={formData.species_type} onChange={e => setFormData({...formData, species_type: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Class (0-6) *</label>
                                                    <input 
                                                        required type="number" min="0" max="6" placeholder="2"
                                                        value={formData.no} onChange={e => setFormData({...formData, no: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Location Name</label>
                                                    <input 
                                                        type="text" placeholder="Optional"
                                                        value={formData.loc} onChange={e => setFormData({...formData, loc: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Zone</label>
                                                    <input 
                                                        type="text" placeholder="Optional"
                                                        value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Survey Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500" size={14} />
                                                    <input 
                                                        type="date"
                                                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                                                        className="w-full bg-forest-900 border border-forest-800 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-forest-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-forest-500 uppercase mb-1">Observations / Notes</label>
                                                <textarea 
                                                    rows="3" placeholder="Additional details..."
                                                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                                                    className="w-full bg-forest-900 border border-forest-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-forest-500 resize-none"
                                                />
                                            </div>

                                            <button 
                                                disabled={submitting}
                                                className="w-full py-3 bg-forest-600 hover:bg-forest-500 text-white font-bold rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                                            >
                                                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                                                Add Observation
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="space-y-6">
                                            <div 
                                                onClick={() => fileInputRef.current.click()}
                                                className="border-2 border-dashed border-forest-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-forest-900/50 transition-colors group"
                                            >
                                                <input 
                                                    type="file" accept=".csv" ref={fileInputRef} className="hidden" 
                                                    onChange={e => setFile(e.target.files[0])}
                                                />
                                                <Upload className="text-forest-600 mb-4 group-hover:text-forest-400 transition-colors" size={48} />
                                                <p className="text-sm text-forest-300 font-medium text-center px-4">
                                                    {file ? file.name : "Click or drag CSV file to upload"}
                                                </p>
                                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                                    {['lat', 'long', 'species type', 'no'].map(col => (
                                                        <span key={col} className="bg-forest-800 px-2 py-0.5 rounded text-[9px] font-bold text-forest-400 uppercase tracking-tighter">{col}</span>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-forest-600 mt-2 italic text-center">
                                                    Optional: loc, zone, notes, date
                                                </p>
                                            </div>
                                            
                                            <button 
                                                onClick={handleCsvUpload}
                                                disabled={!file || submitting}
                                                className={`w-full py-3 ${file ? 'bg-forest-600 hover:bg-forest-500' : 'bg-forest-800 opacity-50 cursor-not-allowed'} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2`}
                                            >
                                                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                Upload Dataset
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Methodology Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 border-t-2 border-forest-500 rounded-xl">
                        <Map className="text-forest-400 mb-3" size={24} />
                        <h3 className="font-bold text-white mb-2">Grid Sampling</h3>
                        <p className="text-xs text-forest-300 leading-relaxed">
                            The Kullu region was divided into standardized grids. Random sampling points were generated within each grid.
                        </p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-t-2 border-forest-500 rounded-xl">
                        <Activity className="text-forest-400 mb-3" size={24} />
                        <h3 className="font-bold text-white mb-2">GPS Tagging</h3>
                        <p className="text-xs text-forest-300 leading-relaxed">
                            Sub-meter accuracy GNSS receivers were utilized. All survey points are permanently geo-tagged with high precision.
                        </p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-t-2 border-forest-500 rounded-xl">
                        <Filter className="text-forest-400 mb-3" size={24} />
                        <h3 className="font-bold text-white mb-2">Identification Protocol</h3>
                        <p className="text-xs text-forest-300 leading-relaxed">
                            Botanical specimens cross-referenced with the Himalayan Flora Database. Ambiguous samples verified by regional experts.
                        </p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-t-2 border-forest-500 rounded-xl">
                        <Download className="text-forest-400 mb-3" size={24} />
                        <h3 className="font-bold text-white mb-2">Data Cleaning</h3>
                        <p className="text-xs text-forest-300 leading-relaxed">
                            Post-processing includes outlier removal, spatial join verification with satellite tiles, and harmonization into CSV formats.
                        </p>
                    </motion.div>
                </div>

                {/* Data Explorer Table */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Data Explorer</h2>
                            <p className="text-sm text-forest-400">Browse and export raw survey observations from istp.csv</p>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter species, zone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-forest-950/50 border border-forest-700/50 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-forest-500"
                                />
                            </div>
                            <button className="flex items-center gap-2 bg-forest-700 hover:bg-forest-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-forest-600/50 shadow-lg">
                                <Download size={16} />
                                CSV
                            </button>
                        </div>
                    </div>

                    <div className="bg-forest-950/50 border border-forest-800/50 rounded-2xl overflow-hidden backdrop-blur-sm min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <RefreshCw className="animate-spin text-forest-400 mr-2" />
                                <span>Loading survey data...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-forest-900/80 border-b border-forest-700/50 text-xs uppercase tracking-wider text-forest-300">
                                            <th className="p-4 font-semibold">Location</th>
                                            <th className="p-4 font-semibold">Zone</th>
                                            <th className="p-4 font-semibold">Coordinates (Lat, Lng)</th>
                                            <th className="p-4 font-semibold">Species Observed</th>
                                            <th className="p-4 font-semibold">Date</th>
                                            <th className="p-4 font-semibold">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-forest-800/30">
                                        {filteredData.map((row, i) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i < 20 ? (i * 0.02) : 0 }}
                                                key={row.id}
                                                className="hover:bg-forest-800/20 transition-colors"
                                            >
                                                <td className="p-4 font-medium text-white">{row.loc}</td>
                                                <td className="p-4 text-forest-300">
                                                    <span className="bg-forest-800/50 px-2 py-1 rounded text-xs">{row.zone}</span>
                                                </td>
                                                <td className="p-4 text-forest-300 font-mono text-xs">{row.lat.toFixed(6)}, {row.lng.toFixed(6)}</td>
                                                <td className="p-4 text-alert-100 font-medium">{row.species}</td>
                                                <td className="p-4 text-forest-300 text-xs">{row.date}</td>
                                                <td className="p-4 text-forest-400 italic text-xs max-w-xs truncate">{row.notes}</td>
                                            </motion.tr>
                                        ))}
                                        {filteredData.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-forest-400">No data found matching your filters.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default SurveyData;
