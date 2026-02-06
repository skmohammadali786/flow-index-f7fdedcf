import { motion } from 'framer-motion';
import { User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TabType = 'calendar' | 'insights' | 'history' | 'tips' | 'analytics' | 'settings' | 'profile';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const mainTabs = [
    { id: 'calendar' as const, label: 'Calendar' },
    { id: 'insights' as const, label: 'Insights' },
    { id: 'tips' as const, label: 'Tips' },
    { id: 'analytics' as const, label: 'Analytics' },
    { id: 'history' as const, label: 'History' },
  ];

  const isMainTab = mainTabs.some(t => t.id === activeTab);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold gradient-primary bg-clip-text text-transparent cursor-pointer"
            style={{ 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundImage: 'var(--gradient-primary)'
            }}
            onClick={() => onTabChange('calendar')}
          >
            Bloom
          </motion.h1>
          
          <div className="flex items-center gap-1">
            <Button
              variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onTabChange('profile')}
              className="rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onTabChange('settings')}
              className="rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors min-w-fit whitespace-nowrap"
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-card shadow-sm rounded-lg"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className={`relative z-10 ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
