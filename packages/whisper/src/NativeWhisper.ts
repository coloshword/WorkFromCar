import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModel: (modelPath: string) => Promise<boolean>;

  transcribeWavFile(wavPath: string): Promise<string>;

  pcmBufferToText(pcmBuffer: number[]): Promise<string>;

  initVad: (vadPath: string) => Promise<boolean>;

  releaseVad: () => Promise<void>;

  processVadFrame(pcm16k: number[]): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WFCWhisper');
