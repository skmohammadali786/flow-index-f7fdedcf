import { motion } from 'framer-motion';
import { User, Settings, Lightbulb, Share2, FileText, Brain, Stethoscope, Calendar, TrendingUp, BarChart3, Activity, History, BookHeart, Egg, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TabType = 'calendar' | 'insights' | 'history' | 'tips' | 'analytics' | 'charts' | 'share' | 'report' | 'brain' | 'clinical' | 'journal' | 'fertility' | 'pregnancy' | 'settings' | 'profile';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const mainTabs = [
    { id: 'calendar' as const, label: 'Cal', fullLabel: 'Calendar', icon: Calendar },
    { id: 'insights' as const, label: 'Ins', fullLabel: 'Insights', icon: TrendingUp },
    { id: 'charts' as const, label: 'Chrt', fullLabel: 'Charts', icon: BarChart3 },
    { id: 'analytics' as const, label: 'Ana', fullLabel: 'Analytics', icon: Activity },
    { id: 'clinical' as const, label: 'Clin', fullLabel: 'Clinical', icon: Stethoscope },
    { id: 'brain' as const, label: 'Brain', fullLabel: 'Brain Forecast', icon: Brain },
    { id: 'history' as const, label: 'Hist', fullLabel: 'History', icon: History },
  ];

  const moreOptions = [
    { id: 'fertility' as const, label: 'Fertility Tracking', icon: Egg },
    { id: 'pregnancy' as const, label: 'Pregnancy & Birth', icon: Baby },
    { id: 'tips' as const, label: 'Health Tips', icon: Lightbulb },
    { id: 'share' as const, label: 'Partner Share', icon: Share2 },
    { id: 'report' as const, label: 'Health Report', icon: FileText },
    { id: 'journal' as const, label: 'Wellness Journal', icon: BookHeart },
  ];

  const isMoreTab = moreOptions.some(t => t.id === activeTab);

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
            Flow Index
          </motion.h1>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isMoreTab ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-full px-3"
                >
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
              {moreOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => onTabChange(option.id)}
                      className="cursor-pointer"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
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

        <nav className="grid grid-cols-7 gap-1 bg-muted rounded-xl p-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative py-2.5 px-1 rounded-lg transition-colors flex items-center justify-center"
                title={tab.fullLabel}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-card shadow-sm rounded-lg"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <Icon className={cn(
                  "relative z-10 h-5 w-5",
                  activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'
                )} />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
