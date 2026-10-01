"use client";

import Link from "next/link";
import { motion } from "motion/react";

const DURATION = 0.25;
const STAGGER = 0.025;

interface Props {
  children: string;
  href: string;
  className?: string;
}

const FlipLink = ({ children, href, className }: Props) => {
  return (
    <Link
      href={href}
      className={`relative block overflow-hidden whitespace-nowrap text-[13px] font-medium tracking-[0.01em] text-foreground/80 hover:text-foreground transition-colors ${className || ''}`}
    >
      <motion.div initial="initial" whileHover="hovered" className="relative">
      <div>
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: 0,
              },
              hovered: {
                y: "-100%",
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: "100%",
              },
              hovered: {
                y: 0,
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
      </motion.div>
    </Link>
  );
};

export default FlipLink;
