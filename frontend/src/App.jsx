import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  Globe as OverviewIcon,
  Map as MapIcon,
  ClipboardList as SurveyIcon,
  Satellite as RemoteIcon,
  BrainCircuit as RiskIcon,
  Server as DeviceIcon,
  ShieldAlert
} from 'lucide-react';

// New 6-Tab Pages
import Overview from './pages/Overview';
import InteractiveMap from './pages/InteractiveMap';
import SurveyData from './pages/SurveyData';
import RemoteSensing from './pages/RemoteSensing';
import RiskModels from './pages/RiskModels';
import DeviceDashboard from './pages/DeviceDashboard';

function App() {
  return (
    <Router>
      <div className="flex h-screen w-full overflow-hidden bg-forest-900 text-forest-50">
        {/* Sidebar Navigation */}
        <aside className="w-64 glass-panel m-4 flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-forest-600/30">
              <h1 className="text-xl font-bold tracking-wider text-forest-50 flex items-center gap-2">
                <ShieldAlert className="text-alert-500" />
                Himalayan Forest Guardian
              </h1>
            </div>

            <nav className="p-4 space-y-2 mt-4 text-sm font-medium">
              <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-forest-700/50 transition-colors">
                <OverviewIcon size={18} className="text-forest-300" />
                <span>Overview</span>
              </Link>
              <Link to="/map" className="flex items-center gap-3 p-3 rounded-lg hover:bg-forest-700/50 transition-colors">
                <MapIcon size={18} className="text-forest-300" />
                <span>Interactive Map</span>
              </Link>
              <Link to="/survey" className="flex items-center gap-3 p-3 rounded-lg hover:bg-forest-700/50 transition-colors">
                <SurveyIcon size={18} className="text-forest-300" />
                <span>Survey & Field Data</span>
              </Link>
              <Link to="/remote-sensing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-forest-700/50 transition-colors">
                <RemoteIcon size={18} className="text-forest-300" />
                <span>Remote Sensing & Analysis</span>
              </Link>
              <Link to="/risk-models" className="flex items-center gap-3 p-3 rounded-lg hover:bg-forest-700/50 transition-colors">
                <RiskIcon size={18} className="text-forest-300" />
                <span>Risk Prediction & AI Models</span>
              </Link>
              <Link to="/devices" className="flex items-center gap-3 p-3 rounded-lg hover:bg-forest-700/50 transition-colors">
                <DeviceIcon size={18} className="text-forest-300" />
                <span>Guardian Device Dashboard</span>
              </Link>
            </nav>
          </div>

          <div className="p-6 text-sm text-forest-400">
            System Online • v1.0
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/map" element={<InteractiveMap />} />
            <Route path="/survey" element={<SurveyData />} />
            <Route path="/remote-sensing" element={<RemoteSensing />} />
            <Route path="/risk-models" element={<RiskModels />} />
            <Route path="/devices" element={<DeviceDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
