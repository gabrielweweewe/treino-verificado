"use client";

import { motion } from "framer-motion";

interface ConfettiBurstProps {
  visible: boolean;
}

const dots = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  x: Math.cos((index / 12) * Math.PI * 2) * (40 + (index % 3) * 16),
  y: Math.sin((index / 12) * Math.PI * 2) * (34 + (index % 2) * 18),
}));

export function ConfettiBurst({ visible }: ConfettiBurstProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {dots.map((dot) => (
        <motion.span
          key={dot.id}
          initial={{ opacity: 0.9, scale: 1, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 0.2, x: dot.x, y: dot.y }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute h-2 w-2 rounded-full bg-emerald-400"
        />
      ))}
    </div>
  );
}
