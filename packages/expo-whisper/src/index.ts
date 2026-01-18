import ExpoWhisperModule from './ExpoWhisperModule';

export function ping(): string {
  return ExpoWhisperModule.ping();
}

export function pingFromObjc(): string {
  return ExpoWhisperModule.pingFromObjc();
}

export function init(modelPath: string): Promise<void> {
  return ExpoWhisperModule.init(modelPath);
}

export async function transcribeFile(filePath: string): Promise<string> {
  return await ExpoWhisperModule.transcribeFile(filePath);
}

export function ttsConfigure(duckOthers = true): void {
  ExpoWhisperModule.ttsConfigure(duckOthers);
}

export type TTSSpeakOptions = {
  language?: string; // e.g. "en-US"
  rate?: number;     // iOS-ish float; keep near default unless you know what you’re doing
  pitch?: number;    // 0.5–2.0
  volume?: number;   // 0.0–1.0
};

export function ttsSpeak(text: string, opts: TTSSpeakOptions = {}): void {
  ExpoWhisperModule.ttsSpeak(
    text,
    opts.language ?? null,
    opts.rate ?? null,
    opts.pitch ?? null,
    opts.volume ?? null
  );
}

export function ttsStop(): void {
  ExpoWhisperModule.ttsStop();
}

export function ttsIsSpeaking(): boolean {
  return ExpoWhisperModule.ttsIsSpeaking();
}
