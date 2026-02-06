import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calendar' | 'insights' | 'history';
  onTabChange: (tab: 'calendar' | 'insights' | 'history') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs = [
    { id: 'calendar' as const, label: 'Calendar' },
    { id: 'insights' as const, label: 'Insights' },
    { id: 'history' as const, label: 'History' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold gradient-primary bg-clip-text text-transparent"
            style={{ 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundImage: 'var(--gradient-primary)'
            }}
          >
            Bloom
          </motion.h1>
        </div>

        <nav className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors"
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
