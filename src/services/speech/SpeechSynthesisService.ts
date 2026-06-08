export type SpeechVoice = {
  id: string;
  name: string;
  lang: string;
};

export type SpeakOptions = {
  voiceId?: string;
  rate?: number;
  pitch?: number;
};

export type SpeechSynthesisService = {
  isSupported(): boolean;
  getVoices(): SpeechVoice[];
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
};

export class BrowserSpeechSynthesisService implements SpeechSynthesisService {
  isSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices() {
    if (!this.isSupported()) {
      return [];
    }

    return window.speechSynthesis.getVoices().map((voice, index) => ({
      id: `${voice.name}-${voice.lang}-${index}`,
      name: voice.name,
      lang: voice.lang,
    }));
  }

  speak(text: string, options?: SpeakOptions) {
    return new Promise<void>((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("Speech synthesis is not supported in this browser."));
        return;
      }

      window.speechSynthesis.cancel();

      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceIndex = voices.findIndex(
        (voice, index) => `${voice.name}-${voice.lang}-${index}` === options?.voiceId
      );

      if (voiceIndex >= 0) {
        utterance.voice = voices[voiceIndex];
      }

      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("Speech playback failed."));
      window.speechSynthesis.speak(utterance);
    });
  }

  stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  pause() {
    if (this.isSupported()) {
      window.speechSynthesis.pause();
    }
  }

  resume() {
    if (this.isSupported()) {
      window.speechSynthesis.resume();
    }
  }
}
