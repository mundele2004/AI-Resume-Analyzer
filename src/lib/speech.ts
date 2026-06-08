export type SpeechToTextResult = {
  transcript: string;
  confidence?: number;
};

export type SpeechToTextService = {
  transcribe(audio: Blob): Promise<SpeechToTextResult>;
};

export type TextToSpeechService = {
  speak(text: string): Promise<void>;
  stop(): void;
};

export class UnconfiguredSpeechToTextService implements SpeechToTextService {
  async transcribe(): Promise<SpeechToTextResult> {
    throw new Error("Speech-to-text service is not configured yet.");
  }
}

export class BrowserTextToSpeechService implements TextToSpeechService {
  async speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      throw new Error("Text-to-speech is not supported in this browser.");
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
