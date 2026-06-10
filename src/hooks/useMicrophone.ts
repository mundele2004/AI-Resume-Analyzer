"use client";

import { useCallback, useRef, useState } from "react";

type MicrophoneState = "idle" | "requesting" | "recording" | "error";

export function useMicrophone() {
  const [state, setState] = useState<MicrophoneState>("idle");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      setState("error");
      return null;
    }

    try {
      setState("requesting");
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setState("recording");
      return stream;
    } catch {
      setError("Unable to access the microphone.");
      setState("error");
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setState("idle");
  }, []);

  return {
    state,
    error,
    isRecording: state === "recording",
    start,
    stop,
  };
}
