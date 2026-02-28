import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, Lightbulb, Share2, FileText, Brain, Stethoscope, 
  Calendar, TrendingUp, BarChart3, Activity, History, BookHeart, 
  Egg, Baby, LayoutDashboard, Dumbbell, Sparkles, Apple, Moon, 
  GitCompare, CalendarDays, Menu, X, Heart, Leaf, ClipboardList, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabType = 'calendar' | 'insights' | 'history' | 'tips' | 'analytics' | 'charts' | 'share' | 'report' | 'brain' | 'clinical' | 'journal' | 'fertility' | 'pregnancy' | 'dashboard' | 'workout' | 'mindmap' | 'nutrition' | 'sleep' | 'cyclecompare' | 'monthlyreport' | 'settings' | 'profile';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

type CategoryKey = 'core' | 'health' | 'wellness' | 'reports';

const categories: { key: CategoryKey; label: string; icon: any }[] = [
  { key: 'core', label: 'Core', icon: PieChart },
  { key: 'health', label: 'Health', icon: Heart },
  { key: 'wellness', label: 'Wellness', icon: Leaf },
  { key: 'reports', label: 'Reports', icon: ClipboardList },
];

const tabsByCategory: Record<CategoryKey, { id: TabType; label: string; icon: any }[]> = {
  core: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'history', label: 'History', icon: History },
  ],
  health: [
    { id: 'clinical', label: 'Clinical', icon: Stethoscope },
    { id: 'brain', label: 'Brain', icon: Brain },
    { id: 'fertility', label: 'Fertility', icon: Egg },
    { id: 'pregnancy', label: 'Pregnancy', icon: Baby },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'cyclecompare', label: 'Compare', icon: GitCompare },
  ],
  wellness: [
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'journal', label: 'Journal', icon: BookHeart },
    { id: 'mindmap', label: 'Mind Map', icon: Sparkles },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
  ],
  reports: [
    { id: 'monthlyreport', label: 'Monthly', icon: CalendarDays },
    { id: 'report', label: 'Health', icon: FileText },
    { id: 'share', label: 'Partner', icon: Share2 },
  ],
};

function getCategoryForTab(tab: TabType): CategoryKey {
  for (const [cat, tabs] of Object.entries(tabsByCategory)) {
    if (tabs.some(t => t.id === tab)) return cat as CategoryKey;
  }
  return 'core';
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(() => getCategoryForTab(activeTab));
  const [expanded, setExpanded] = useState(false);

  const currentTabs = tabsByCategory[activeCategory];

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab);
    setExpanded(false);
  };

  const handleCategoryChange = (cat: CategoryKey) => {
    setActiveCategory(cat);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-2xl mx-auto px-3 py-3">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-xl font-bold gradient-primary bg-clip-text text-transparent cursor-pointer"
            style={{ 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundImage: 'var(--gradient-primary)'
            }}
            onClick={() => { handleTabChange('calendar'); setActiveCategory('core'); }}
          >
            Flow Index
          </motion.h1>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="rounded-full h-8 w-8"
            >
              {expanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleTabChange('profile')}
              className="rounded-full h-8 w-8"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleTabChange('settings')}
              className="rounded-full h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category chips - icons instead of emojis */}
        <div className="flex gap-1.5 mb-2">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.key;
            const hasActiveTab = tabsByCategory[cat.key].some(t => t.id === activeTab);
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={cn(
                  "relative flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : hasActiveTab
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <CatIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </span>
                {hasActiveTab && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Icon grid for active category */}
        <AnimatePresence mode="wait">
          <motion.nav
            key={activeCategory}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "grid gap-1 bg-muted rounded-xl p-1",
              currentTabs.length <= 3 ? "grid-cols-3" :
              currentTabs.length <= 5 ? "grid-cols-5" : "grid-cols-6"
            )}
          >
            {currentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="relative py-2 px-1 rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5"
                  title={tab.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-card shadow-sm rounded-lg"
                      transition={{ type: 'spring', duration: 0.4 }}
                    />
                  )}
                  <Icon className={cn(
                    "relative z-10 h-4 w-4",
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    "relative z-10 text-[9px] leading-tight font-medium truncate w-full text-center",
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </motion.nav>
        </AnimatePresence>

        {/* Expanded overlay - clean icons, no emojis */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-2"
            >
              <div className="bg-card rounded-xl border border-border p-3 space-y-3">
                {categories.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.key}>
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                        <CatIcon className="h-3 w-3" />
                        {cat.label}
                      </p>
                      <div className="grid grid-cols-4 gap-1">
                        {tabsByCategory[cat.key].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => { handleTabChange(tab.id); setActiveCategory(cat.key); }}
                              className={cn(
                                "flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-[9px] font-medium leading-tight text-center truncate w-full">
                                {tab.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-1 border-t border-border">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleTabChange('profile')}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors",
                        activeTab === 'profile' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4" /> Profile
                    </button>
                    <button
                      onClick={() => handleTabChange('settings')}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors",
                        activeTab === 'settings' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
