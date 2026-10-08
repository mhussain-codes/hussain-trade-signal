import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, LineChart, Cpu, Newspaper, History, Settings, Info } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Terminal', path: '/' },
  { icon: LineChart, label: 'Live Chart', path: '/chart' },
  { icon: Cpu, label: 'AI Engine', path: '/analysis' },
  { icon: Newspaper, label: 'Intelligence', path: '/news' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Info, label: 'About', path: '/about' },
];

export const Sidebar = () => {
  return (
    <div className="w-64 bg-card border-r border-white/5 flex flex-col h-screen fixed hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo.jpg" alt="HTS Logo" className="w-10 h-10 rounded-lg object-cover border border-primary/20" />
        <div>
          <h1 className="font-bold text-lg leading-tight">HTS</h1>
          <p className="text-xs text-text-muted">TRADE SIGNAL</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
              \${isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-muted hover:text-text hover:bg-white/5'}
            `}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-primary font-medium">Educational Platform</p>
        </div>
      </div>
    </div>
  );
};

export const MobileHeader = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-white/5 z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <img src="/logo.jpg" alt="HTS Logo" className="w-8 h-8 rounded-lg object-cover border border-primary/20" />
        <h1 className="font-bold text-lg leading-tight text-white">HTS</h1>
      </div>
      <button 
        onClick={toggleSidebar}
        className="p-2 text-text-muted hover:text-white transition-colors focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
    </div>
  );
};

export const Layout = ({ children }: { children: ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Desktop (static) & Mobile (absolute) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out \${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="HTS Logo" className="w-10 h-10 rounded-lg object-cover border border-primary/20" />
            <div>
              <h1 className="font-bold text-lg leading-tight">HTS</h1>
              <p className="text-xs text-text-muted">TRADE SIGNAL</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                \${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-muted hover:text-text hover:bg-white/5'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
            <p className="text-xs text-primary font-medium">Educational Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        <MobileHeader toggleSidebar={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
};
