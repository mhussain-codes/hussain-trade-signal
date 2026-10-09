import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import BinaryBot from './components/BinaryBot'; 
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
          {/* YAHAN CHANGE KIYA HAI: justify-center aur items-center add kiya ha taake mid mein aaye */}
          <Route path="/" element={
            <div className="flex w-full min-h-screen justify-center items-center bg-gray-900 pb-20">
              <BinaryBot />
            </div>
          } />
          
          <Route path="/chart" element={<Navigate to="/" replace />} /> 
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