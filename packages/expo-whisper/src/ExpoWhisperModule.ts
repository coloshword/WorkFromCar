import { NativeModule, requireNativeModule, EventSubscription } from 'expo';
import { ExpoWhisperModuleEvents } from './ExpoWhisper.types';

declare class ExpoWhisperModule extends NativeModule<ExpoWhisperModuleEvents> {
  ping: () => string;
  pingFromObjc: () => string;
  init: (modelPath: string) => Promise<void>;
  transcribeFile: (filePath: string) => Promise<string>;
  ttsConfigure: (duckOthers: boolean) => void;
  ttsSpeak: (
    text: string,
    language?: string | null,
    rate?: number | null,
    pitch?: number | null,
    volume?: number | null
  ) => void;
  ttsStop: () => void;
  ttsIsSpeaking: () => boolean;
  
  // VAD and continuous recording functions
  startContinuousRecording: () => boolean;
  stopContinuousRecording: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  isListening: () => boolean;
  isVoiceDetected: () => boolean;
  
  // Event emitters
  addListener: <EventName extends keyof ExpoWhisperModuleEvents>(
    eventName: EventName,
    listener: ExpoWhisperModuleEvents[EventName]
  ) => EventSubscription;
}

export default requireNativeModule<ExpoWhisperModule>('ExpoWhisper');
