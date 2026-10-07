import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { News } from './pages/News';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { DeveloperPanel } from './pages/DeveloperPanel';
import { startMarketSimulator, stopMarketSimulator } from './store/useMarketStore';

function App() {
  useEffect(() => {
    // Start the mock price simulator on load
    startMarketSimulator();
    
    return () => {
      stopMarketSimulator();
    };
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chart" element={<Navigate to="/" replace />} /> {/* Chart is in dashboard for now */}
          <Route path="/analysis" element={<Navigate to="/" replace />} />
          <Route path="/news" element={<News />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
            <Route path="/dev" element={<DeveloperPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
