import { NativeModule, requireNativeModule } from 'expo';
import { ExpoWhisperModuleEvents } from './ExpoWhisper.types';

declare class ExpoWhisperModule extends NativeModule<ExpoWhisperModuleEvents> {
  ping: () => string;
  pingFromObjc: () => string;
}

export default requireNativeModule<ExpoWhisperModule>('ExpoWhisper');