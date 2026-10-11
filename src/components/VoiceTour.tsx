"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const TOUR_SCRIPT = "Welcome to Raphael Community Health. A health records platform built for Kenyan health workers who work where there is no internet signal. Record patient visits, track immunisations, monitor maternal health, and report community data all from your phone, even offline. When you get signal, everything syncs automatically. Register as a health worker or set up your county today.";

export function VoiceTour() {
  const hasStarted = useRef(false);
  const [speaking, setSpeaking] = useState(false);

  const play = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(TOUR_SCRIPT);
    utterance.lang = "en-KE";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const trigger = () => {
      if (hasStarted.current) return;
      hasStarted.current = true;
      play();
    };
    const pointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".voice-tour-button")) return;
      trigger();
    };
    window.addEventListener("scroll", trigger, { once: true, passive: true });
    document.addEventListener("pointerdown", pointer, { once: true, passive: true });
    return () => {
      window.removeEventListener("scroll", trigger);
      document.removeEventListener("pointerdown", pointer);
    };
  }, [play]);

  const onClick = () => {
    hasStarted.current = true;
    if (speaking && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    play();
  };

  return (
    <button className="voice-tour-button" type="button" onClick={onClick} aria-label={speaking ? "Stop voice tour" : "Play voice tour"} aria-pressed={speaking}>
      {speaking ? <VolumeX /> : <Volume2 />}
      <span className="floating-tooltip" role="tooltip">{speaking ? "Stop voice tour" : "Hear the Raphael Community Health tour"}</span>
    </button>
  );
}
