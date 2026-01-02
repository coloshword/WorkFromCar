import { NativeModule, requireNativeModule } from 'expo';

import { ExpoWhisperModuleEvents } from './ExpoWhisper.types';

declare class ExpoWhisperModule extends NativeModule<ExpoWhisperModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoWhisperModule>('ExpoWhisper');
