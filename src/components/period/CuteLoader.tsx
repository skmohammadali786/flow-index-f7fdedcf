import { motion } from 'framer-motion';

const BlobCharacter = ({ delay = 0, size = 28, color = 'hsl(var(--primary))' }: { delay?: number; size?: number; color?: string }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    initial={{ y: 0, scale: 0.8 }}
    animate={{
      y: [0, -14, 0],
      scale: [0.8, 1.1, 0.8],
      rotate: [0, 8, -8, 0],
    }}
    transition={{
      duration: 1.6,
      delay,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1],
    }}
  >
    {/* Blob body */}
    <motion.path
      d="M20 4C28 4 36 10 36 20C36 30 28 36 20 36C12 36 4 30 4 20C4 10 12 4 20 4Z"
      fill={color}
      animate={{
        d: [
          "M20 4C28 4 36 10 36 20C36 30 28 36 20 36C12 36 4 30 4 20C4 10 12 4 20 4Z",
          "M20 6C30 6 34 12 34 20C34 28 28 34 20 34C10 34 6 28 6 20C6 12 10 6 20 6Z",
          "M20 4C28 4 36 10 36 20C36 30 28 36 20 36C12 36 4 30 4 20C4 10 12 4 20 4Z",
        ],
      }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Left eye */}
    <motion.ellipse
      cx="14" cy="17" rx="2.5" ry="3"
      fill="white"
      animate={{ ry: [3, 0.5, 3] }}
      transition={{ duration: 3, delay: delay + 1.2, repeat: Infinity, repeatDelay: 2 }}
    />
    {/* Right eye */}
    <motion.ellipse
      cx="26" cy="17" rx="2.5" ry="3"
      fill="white"
      animate={{ ry: [3, 0.5, 3] }}
      transition={{ duration: 3, delay: delay + 1.2, repeat: Infinity, repeatDelay: 2 }}
    />
    {/* Pupils */}
    <motion.circle cx="14.5" cy="17.5" r="1.2" fill="hsl(var(--foreground))" opacity={0.7}
      animate={{ cy: [17.5, 16, 17.5] }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.circle cx="26.5" cy="17.5" r="1.2" fill="hsl(var(--foreground))" opacity={0.7}
      animate={{ cy: [17.5, 16, 17.5] }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Cheek blush */}
    <circle cx="10" cy="23" r="2.5" fill="hsl(var(--primary))" opacity={0.35} />
    <circle cx="30" cy="23" r="2.5" fill="hsl(var(--primary))" opacity={0.35} />
    {/* Smile */}
    <motion.path
      d="M15 24 Q20 29 25 24"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      animate={{
        d: [
          "M15 24 Q20 29 25 24",
          "M15 25 Q20 27 25 25",
          "M15 24 Q20 29 25 24",
        ],
      }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    className="absolute"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 90],
    }}
    transition={{
      duration: 1.8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <path
      d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z"
      fill="hsl(var(--primary))"
      opacity={0.6}
    />
  </motion.svg>
);

const FloatingRing = ({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    className="absolute rounded-full border-2 border-primary/20"
    style={{ width: size, height: size }}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{
      opacity: [0, 0.4, 0],
      scale: [0.5, 1.4, 1.8],
    }}
    transition={{
      duration: 2.4,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  />
);

export const CuteLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-5">
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 80 }}>
      {/* Expanding rings */}
      <FloatingRing delay={0} size={60} />
      <FloatingRing delay={0.8} size={60} />
      <FloatingRing delay={1.6} size={60} />

      {/* Sparkles around */}
      <Sparkle delay={0.2} x={8} y={4} />
      <Sparkle delay={1.0} x={98} y={8} />
      <Sparkle delay={0.6} x={52} y={-2} />
      <Sparkle delay={1.4} x={4} y={56} />
      <Sparkle delay={1.8} x={100} y={52} />

      {/* Three bouncing blob friends */}
      <div className="flex items-end gap-2">
        <BlobCharacter delay={0} size={30} color="hsl(var(--primary))" />
        <BlobCharacter delay={0.2} size={38} color="hsl(var(--accent))" />
        <BlobCharacter delay={0.4} size={30} color="hsl(var(--secondary))" />
      </div>
    </div>

    {/* Animated dots text */}
    <div className="flex items-center gap-1">
      <span className="text-sm text-muted-foreground font-medium">{message}</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-primary/50"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
            transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </span>
    </div>
  </div>
);
