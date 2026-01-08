import { NativeModule, requireNativeModule } from 'expo';
import { ExpoWhisperModuleEvents } from './ExpoWhisper.types';

declare class ExpoWhisperModule extends NativeModule<ExpoWhisperModuleEvents> {
  ping: () => string;
  pingFromObjc: () => string;
  init: (modelPath: string) => Promise<void>;
  transcribeFile: (filePath: string) => Promise<string>;
}

export default requireNativeModule<ExpoWhisperModule>('ExpoWhisper');