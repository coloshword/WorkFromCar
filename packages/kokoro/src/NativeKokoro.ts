import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModel: (modelDir: string) => Promise<boolean>;

  speak(text: string, speed: number): Promise<void>;

  stop(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WFCKokoro');

