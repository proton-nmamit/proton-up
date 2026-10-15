"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&";

const LOAD_STEPS = [
  "INITIALIZING PROTON NODE...",
  "VERIFYING NMAMIT CYBER CREDENTIALS...",
  "ESTABLISHING ENCRYPTED UPLINK...",
  "SYSTEM ONLINE // ACCESS GRANTED",
];

function ScrambleLoadText({ target, onComplete }: { target: string; onComplete: () => void }) {
  const [display, setDisplay] = useState(target);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    let iterations = 0;
    const maxIterations = 24;

    const interval = setInterval(() => {
      if (iterations >= maxIterations) {
        setDisplay(target);
        setProgress(100);
        setStepIdx(3);
        clearInterval(interval);
        setTimeout(onComplete, 450);
        return;
      }

      const currentProgress = Math.min(99, Math.round((iterations / maxIterations) * 100));
      setProgress(currentProgress);

      if (currentProgress > 70) setStepIdx(2);
      else if (currentProgress > 35) setStepIdx(1);
      else setStepIdx(0);

      setDisplay(
        prev =>
          target
            .split("")
            .map((char, i) => {
              if (i < iterations / (maxIterations / target.length)) {
                return target[i];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
      );

      iterations++;
    }, 45);

    return () => clearInterval(interval);
  }, [target, onComplete]);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Central Proton Emblem */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-[#00d05a]/30 border-t-[#00d05a] shadow-[0_0_20px_rgba(0,208,90,0.25)]"
        />
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/90 border border-[#00d05a]/40 flex items-center justify-center overflow-hidden p-2 shadow-[0_0_25px_rgba(0,208,90,0.3)]">
          <Image
            src="/images/Protton_logo.png"
            alt="PROTON"
            width={48}
            height={48}
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_#00d05a]"
            priority
          />
        </div>
      </div>

      {/* Scramble Title */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {display.split("").map((char, idx) => (
          <span
            key={idx}
            className="font-pixel text-4xl sm:text-6xl text-[#00d05a] select-none font-bold inline-block w-[1.1em] text-center drop-shadow-[0_0_20px_rgba(0,208,90,0.5)] tracking-wider"
          >
            {char}
          </span>
        ))}
      </div>

      {/* Cyber Progress Indicator */}
      <div className="w-64 sm:w-72 space-y-2 mt-1 font-mono">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground truncate">{LOAD_STEPS[stepIdx]}</span>
          <span className="text-[#00d05a] font-bold ml-2 shrink-0">{progress}%</span>
        </div>
        <div className="w-full bg-black/80 h-1.5 rounded-full overflow-hidden border border-white/15">
          <motion.div
            className="bg-[#00d05a] h-full shadow-[0_0_12px_#00d05a]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
    const hasLoaded = sessionStorage.getItem("proton_loaded_v3");
    if (hasLoaded) {
      setShow(false);
    }
  }, []);

  // Lock body scroll while loader is active
  useEffect(() => {
    if (show && mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show, mounted]);

  const handleComplete = () => {
    sessionStorage.setItem("proton_loaded_v3", "true");
    setShow(false);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.03 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[999999] w-screen h-screen flex flex-col items-center justify-center bg-black select-none overflow-hidden"
          style={{ backgroundColor: "#000000" }}
        >
          {/* Core Loading Content */}
          <div className="relative z-10">
            <ScrambleLoadText target="PROTON" onComplete={handleComplete} />
          </div>

          {/* Bottom Association Footer */}
          <div className="absolute bottom-8 left-0 right-0 text-center font-mono text-[10px] text-muted-foreground/60 tracking-[0.25em] uppercase">
            NMAMIT CYBERSECURITY ASSOCIATION &bull; SECURE NODE
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
