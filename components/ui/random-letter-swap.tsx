"use client";

import React, { useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface RandomLetterSwapProps extends Omit<HTMLMotionProps<"span">, "children"> {
  label: string;
  staggerDuration?: number;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

export function RandomLetterSwap({ 
  label, 
  staggerDuration = 0.025, 
  ...props 
}: RandomLetterSwapProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
      style={{ display: "inline-block", ...props.style }}
    >
      {label.split("").map((char, i) => (
        <Letter 
          key={i} 
          char={char} 
          isHovered={isHovered} 
          delay={i * staggerDuration} 
        />
      ))}
    </motion.span>
  );
}

function Letter({ char, isHovered, delay }: { char: string, isHovered: boolean, delay: number }) {
  const [displayChar, setDisplayChar] = useState(char);
  
  React.useEffect(() => {
    if (!isHovered) {
      setDisplayChar(char);
      return;
    }
    
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    
    timeoutId = setTimeout(() => {
      let ticks = 0;
      const maxTicks = 12; // Scramble for 12 ticks
      intervalId = setInterval(() => {
        if (ticks >= maxTicks) {
          setDisplayChar(char); // Restore original character
          clearInterval(intervalId);
        } else {
          setDisplayChar(CHARS[Math.floor(Math.random() * CHARS.length)]);
          ticks++;
        }
      }, 30); // 30ms per tick
    }, delay * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [char, isHovered, delay]);

  // Prevent layout shift by keeping spacing for spaces
  return <span style={{ display: "inline-block", minWidth: char === " " ? "0.5em" : "auto" }}>{displayChar}</span>;
}
