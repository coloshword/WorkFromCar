import { NativeModule, requireNativeModule } from 'expo';
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
}

export default requireNativeModule<ExpoWhisperModule>('ExpoWhisper');