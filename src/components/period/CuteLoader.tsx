import { motion } from 'framer-motion';

const floatingPetals = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  emoji: ['🌸', '✨', '💜', '🦋', '🌙', '💫'][i],
  delay: i * 0.3,
  x: Math.cos((i / 6) * Math.PI * 2) * 32,
  y: Math.sin((i / 6) * Math.PI * 2) * 32,
}));

export const CuteLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-6">
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Orbiting petals */}
      {floatingPetals.map((p) => (
        <motion.span
          key={p.id}
          className="absolute text-lg"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, p.x, p.x * 1.2, 0],
            y: [0, p.y, p.y * 1.2, 0],
            scale: [0, 1, 1.1, 0],
          }}
          transition={{
            duration: 2.4,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {p.emoji}
        </motion.span>
      ))}
      {/* Center pulsing heart */}
      <motion.span
        className="text-3xl z-10"
        animate={{
          scale: [1, 1.25, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        💖
      </motion.span>
    </div>
    <motion.p
      className="text-sm text-muted-foreground font-medium"
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {message}
    </motion.p>
  </div>
);
