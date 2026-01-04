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