import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { verifyLicense } from '../services/aiService';
import { ShieldAlert, Server, Database, Key } from 'lucide-react';

export const DeveloperPanel = () => {
  const [dbStatus, setDbStatus] = useState<'Testing...' | 'Connected' | 'Failed'>('Testing...');
  const [apiStatus, setApiStatus] = useState<'Testing...' | 'Working' | 'Failed'>('Testing...');
  const [licenseStatus, setLicenseStatus] = useState<'Testing...' | 'Working' | 'Failed'>('Testing...');
  
  useEffect(() => {
    const testConnections = async () => {
      // 1. Test License Verification (which tests Netlify -> Supabase)
      try {
        const isValid = await verifyLicense('HTS_TEST_LICENSE_001');
        setDbStatus('Connected');
        setLicenseStatus('Working');
      } catch (err: any) {
        setDbStatus('Failed');
        setLicenseStatus('Failed');
      }

      // 2. Test API (AI signal generation wrapper test could be added here, 
      // but license endpoint hitting Netlify is a good start)
      try {
        const response = await fetch('/.netlify/functions/verify-license-endpoint', {
          method: 'POST',
          body: JSON.stringify({ licenseKey: 'HTS_TEST_LICENSE_001' })
        });
        if (response.ok) {
          setApiStatus('Working');
        } else {
          setApiStatus('Failed');
        }
      } catch (e) {
        setApiStatus('Failed');
      }
    };
    
    testConnections();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Developer Panel" />
      <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
        
        <div className="glass-card p-6 border-danger/30 border">
          <div className="flex items-center gap-3 text-danger mb-4">
            <ShieldAlert className="w-6 h-6" />
            <h2 className="text-xl font-bold">Localhost Test Checklist</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusCard 
              icon={<Database />}
              title="Supabase Database"
              status={dbStatus}
            />
            <StatusCard 
              icon={<Server />}
              title="Netlify Functions API"
              status={apiStatus}
            />
            <StatusCard 
              icon={<Key />}
              title="License Verification"
              status={licenseStatus}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

const StatusCard = ({ icon, title, status }: { icon: any, title: string, status: string }) => {
  const getStatusColor = () => {
    if (status === 'Connected' || status === 'Working') return 'text-success bg-success/10 border-success/20';
    if (status === 'Failed') return 'text-danger bg-danger/10 border-danger/20';
    return 'text-text-muted bg-white/5 border-white/10';
  };

  return (
    <div className={"flex items-center justify-between p-4 rounded-lg border " + getStatusColor()}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-bold">{title}</span>
      </div>
      <span className="text-sm font-mono">{status}</span>
    </div>
  );
};
