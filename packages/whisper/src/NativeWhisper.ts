import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModel: (modelPath: string) => Promise<boolean>;

  transcribeWavFile(wavPath: string): Promise<string>;

  pcmBufferToText(pcmBuffer: number[]): Promise<string>;

  initVad: (vadPath: string) => Promise<boolean>;

  vadProcessBuffer(pcmBuffer: number[]): Promise<{ isSpeech: boolean, prob: number }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WFCWhisper');
