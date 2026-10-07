import { ReactNode } from 'react';
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

export const MobileNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-white/5 p-2 flex justify-around items-center z-50 pb-safe">
      {navItems.slice(0, 5).map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
            \${isActive ? 'text-primary' : 'text-text-muted'}
          `}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px]">{item.label.split(' ')[0]}</span>
        </NavLink>
      ))}
    </div>
  );
};

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background text-text flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 mb-16 md:mb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
};
