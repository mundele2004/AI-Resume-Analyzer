type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export type SpeechRecognitionEventResult = {
  transcript: string;
  isFinal: boolean;
};

export type SpeechRecognitionServiceCallbacks = {
  onResult: (result: SpeechRecognitionEventResult) => void;
  onError: (error: string) => void;
  onEnd: () => void;
};

export type SpeechRecognitionService = {
  isSupported(): boolean;
  start(callbacks: SpeechRecognitionServiceCallbacks): void;
  stop(): void;
  abort(): void;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export class BrowserSpeechRecognitionService
  implements SpeechRecognitionService
{
  private recognition: SpeechRecognitionLike | null = null;

  isSupported() {
    if (typeof window === "undefined") {
      return false;
    }

    const speechWindow = window as SpeechWindow;

    return !!(
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    );
  }

  start(callbacks: SpeechRecognitionServiceCallbacks) {
    if (typeof window === "undefined") {
      callbacks.onError("Speech recognition is unavailable.");
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      callbacks.onError("Speech recognition is not supported in this browser.");
      return;
    }

    this.abort();

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        callbacks.onResult({
          transcript: result[0]?.transcript ?? "",
          isFinal: result.isFinal,
        });
      }
    };
    recognition.onerror = (event) => {
      callbacks.onError(event.error ?? "Speech recognition failed.");
    };
    recognition.onend = callbacks.onEnd;
    recognition.start();
    this.recognition = recognition;
  }

  stop() {
    this.recognition?.stop();
  }

  abort() {
    this.recognition?.abort();
    this.recognition = null;
  }
}
