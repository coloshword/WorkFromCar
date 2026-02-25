import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModel: (modelPath: string) => Promise<boolean>;

  speak(text: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WFCWhisper');

