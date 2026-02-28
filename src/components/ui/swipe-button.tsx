import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeButtonProps {
  onConfirm: () => void;
  isLoading?: boolean;
  text?: string;
  className?: string;
  successText?: string;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onConfirm,
  isLoading = false,
  text = 'Swipe to confirm',
  className,
  successText = 'Confirmed!',
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Reset state when isLoading goes from true to false, but keep it if we just confirmed
  useEffect(() => {
    if (!isLoading && isConfirmed) {
      // If we are no longer loading, but still confirmed, wait a bit then reset
      const timer = setTimeout(() => {
        setIsConfirmed(false);
        controls.start({ x: 0 });
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Reset if loading becomes false and not confirmed (e.g. error)
    if (!isLoading && !isConfirmed) {
      controls.start({ x: 0 });
    }
  }, [isLoading, isConfirmed, controls]);

  const handleDragEnd = (event: any, info: any) => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    // Assuming the knob is 40px wide + 8px margins
    const threshold = containerWidth - 48;

    if (info.offset.x >= threshold * 0.75) { // 75% of the way to trigger
      setIsConfirmed(true);
      onConfirm();
      controls.start({ x: containerWidth - 48 }); // Snap to end
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const backgroundWidth = useTransform(x, [0, containerRef.current?.offsetWidth || 300], ['48px', '100%']);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-12 w-full rounded-md bg-primary/10 overflow-hidden flex items-center justify-center select-none border border-primary/20',
        className
      )}
    >
      {/* Background fill */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 bg-primary/20 rounded-md"
        style={{ width: backgroundWidth }}
      />

      {/* Text */}
      <div className="z-0 pointer-events-none absolute w-full text-center flex items-center justify-center">
        {isLoading ? (
          <span className="text-sm font-medium flex items-center gap-2 text-foreground">
            Logging in...
          </span>
        ) : isConfirmed ? (
          <span className="text-sm font-medium text-primary flex items-center gap-2">
            {successText}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground opacity-90 pl-8">
            {text}
          </span>
        )}
      </div>

      {/* Draggable Knob */}
      {!isLoading && !isConfirmed && (
        <motion.div
          className="absolute left-1 top-1 bottom-1 w-10 bg-primary rounded flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-sm"
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </motion.div>
      )}

      {/* Confirmed / Loading state knob placeholder (static) */}
      {(isLoading || isConfirmed) && (
        <motion.div
          className="absolute right-1 top-1 bottom-1 w-10 bg-primary rounded flex items-center justify-center z-10 shadow-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {isLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>
          ) : (
            <Check className="w-5 h-5 text-primary-foreground" />
          )}
        </motion.div>
      )}
    </div>
  );
};
