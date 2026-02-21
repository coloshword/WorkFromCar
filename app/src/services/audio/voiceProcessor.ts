import { VoiceProcessor } from '@picovoice/react-native-voice-processor';

let frameListenerId: string | null = null;

export const FREQUENCY_HZ = 16000;
export const FRAME_LENGTH = 512;

export async function startStreaming() {
  // instance creates a singleton, the first time you access it and returns the same instance every time.
  await VoiceProcessor.instance.start(FRAME_LENGTH, FREQUENCY_HZ);
}

