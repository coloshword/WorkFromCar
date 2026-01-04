import { NativeModule, requireNativeModule } from 'expo';
import { ExpoWhisperModuleEvents } from './ExpoWhisper.types';

declare class ExpoWhisperModule extends NativeModule<ExpoWhisperModuleEvents> {
  ping: () => string;
  pingFromObjc: () => string;
  init: (modelPath: string) => Promise<void>;
}

export default requireNativeModule<ExpoWhisperModule>('ExpoWhisper');