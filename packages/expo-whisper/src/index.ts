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
  console.log('transcribing file from index.ts');
  return await ExpoWhisperModule.transcribeFile(filePath);
}