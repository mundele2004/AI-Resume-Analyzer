"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { BrowserSpeechRecognitionService } from "@/services/speech/SpeechRecognitionService";

type RecognitionStatus =
  | "idle"
  | "listening"
  | "recording"
  | "processing"
  | "unsupported"
  | "error";

export function useSpeechRecognition({ silenceMs = 1800 } = {}) {
  const service = useMemo(() => new BrowserSpeechRecognitionService(), []);
  const [status, setStatus] = useState<RecognitionStatus>(
    service.isSupported() ? "idle" : "unsupported"
  );
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    setStatus((current) =>
      current === "listening" || current === "recording" ? "processing" : current
    );
    service.stop();
  }, [clearSilenceTimer, service]);

  const startListening = useCallback(() => {
    if (!service.isSupported()) {
      setStatus("unsupported");
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setStatus("listening");

    service.start({
      onResult: (result) => {
        clearSilenceTimer();

        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${result.transcript}`.trim();
          setTranscript(finalTranscriptRef.current);
          setInterimTranscript("");
        } else {
          setInterimTranscript(result.transcript);
        }

        setStatus("recording");
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, silenceMs);
      },
      onError: (message) => {
        clearSilenceTimer();
        setError(message);
        setStatus("error");
      },
      onEnd: () => {
        clearSilenceTimer();
        setStatus((current) => (current === "processing" ? "idle" : current));
      },
    });
  }, [clearSilenceTimer, service, silenceMs, stopListening]);

  const retry = useCallback(() => {
    service.abort();
    startListening();
  }, [service, startListening]);

  return {
    status,
    transcript,
    interimTranscript,
    liveTranscript: [transcript, interimTranscript].filter(Boolean).join(" "),
    error,
    isSupported: service.isSupported(),
    isListening: status === "listening" || status === "recording",
    startListening,
    stopListening,
    retry,
  };
}
