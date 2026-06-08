"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BrowserSpeechSynthesisService,
  type SpeechVoice,
} from "@/services/speech/SpeechSynthesisService";

export function useSpeechSynthesis() {
  const service = useMemo(() => new BrowserSpeechSynthesisService(), []);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!service.isSupported()) {
      return;
    }

    const loadVoices = () => {
      const nextVoices = service.getVoices();
      setVoices(nextVoices);
      setSelectedVoiceId((current) => current || nextVoices[0]?.id || "");
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [service]);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return;
      }

      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);

      try {
        await service.speak(text, { voiceId: selectedVoiceId });
      } catch (speechError) {
        setError(
          speechError instanceof Error
            ? speechError.message
            : "Speech playback failed."
        );
      } finally {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    },
    [selectedVoiceId, service]
  );

  const stop = useCallback(() => {
    service.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [service]);

  const pause = useCallback(() => {
    service.pause();
    setIsPaused(true);
  }, [service]);

  const resume = useCallback(() => {
    service.resume();
    setIsPaused(false);
  }, [service]);

  return {
    isSupported: service.isSupported(),
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    isSpeaking,
    isPaused,
    error,
    speak,
    stop,
    pause,
    resume,
  };
}
