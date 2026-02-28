import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModel: (modelPath: string, vadPath: string) => Promise<boolean>;

  transcribeWavFile(wavPath: string): Promise<string>;

  pcmBufferToText(pcmBuffer: number[]): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WFCWhisper');
