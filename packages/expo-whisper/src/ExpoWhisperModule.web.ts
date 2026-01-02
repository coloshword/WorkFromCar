import { registerWebModule, NativeModule } from 'expo';

import { ExpoWhisperModuleEvents } from './ExpoWhisper.types';

class ExpoWhisperModule extends NativeModule<ExpoWhisperModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoWhisperModule, 'ExpoWhisperModule');
