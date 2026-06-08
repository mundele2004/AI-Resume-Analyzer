export type MicrophonePermissionState = "unsupported" | "prompt" | "granted" | "denied";

export type MicrophoneService = {
  getPermissionState(): Promise<MicrophonePermissionState>;
  requestStream(): Promise<MediaStream>;
  stopStream(stream: MediaStream): void;
};

export class BrowserMicrophoneService implements MicrophoneService {
  async getPermissionState(): Promise<MicrophonePermissionState> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return "unsupported";
    }

    if (!navigator.permissions?.query) {
      return "prompt";
    }

    try {
      const status = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      return status.state === "granted"
        ? "granted"
        : status.state === "denied"
          ? "denied"
          : "prompt";
    } catch {
      return "prompt";
    }
  }

  requestStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser.");
    }

    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  stopStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
