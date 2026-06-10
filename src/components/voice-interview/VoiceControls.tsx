import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export function VoiceControls({
  isListening,
  isSpeaking,
  isPaused,
  canSubmit,
  onStartListening,
  onStopListening,
  onSubmit,
  onRetry,
  onSkip,
  onEnd,
  onStopSpeaking,
  onPauseSpeaking,
  onResumeSpeaking,
}: {
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  canSubmit: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmit: () => void;
  onRetry: () => void;
  onSkip: () => void;
  onEnd: () => void;
  onStopSpeaking: () => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isSpeaking || isListening}
          onClick={onStartListening}
        >
          <Mic className="size-4" aria-hidden="true" />
          Start Listening
        </Button>
        <Button
          variant="outline"
          disabled={!isListening}
          onClick={onStopListening}
        >
          <Square className="size-4" aria-hidden="true" />
          Stop Listening
        </Button>
        <Button disabled={!canSubmit || isSpeaking} onClick={onSubmit}>
          <Send className="size-4" aria-hidden="true" />
          Submit Transcript
        </Button>
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry Recording
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!isSpeaking} onClick={onPauseSpeaking}>
          <Pause className="size-4" aria-hidden="true" />
          Pause
        </Button>
        <Button variant="outline" disabled={!isPaused} onClick={onResumeSpeaking}>
          <Play className="size-4" aria-hidden="true" />
          Resume
        </Button>
        <Button variant="outline" disabled={!isSpeaking} onClick={onStopSpeaking}>
          <VolumeX className="size-4" aria-hidden="true" />
          Stop Voice
        </Button>
        <Button variant="outline" onClick={onSkip}>
          <SkipForward className="size-4" aria-hidden="true" />
          Skip
        </Button>
        <Button variant="destructive" onClick={onEnd}>
          <Volume2 className="size-4" aria-hidden="true" />
          End Interview
        </Button>
      </div>
    </div>
  );
}
