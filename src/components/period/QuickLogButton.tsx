import { motion } from 'framer-motion';
import { Droplets, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickLogButtonProps {
  onLogToday: () => void;
  isOnPeriod: boolean;
}

export function QuickLogButton({ onLogToday, isOnPeriod }: QuickLogButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={onLogToday}
        size="lg"
        className={cn(
          "rounded-full h-16 w-16 shadow-elevated",
          isOnPeriod 
            ? "bg-coral hover:bg-coral/90" 
            : "gradient-primary hover:opacity-90"
        )}
      >
        {isOnPeriod ? (
          <Droplets className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </motion.div>
  );
}
