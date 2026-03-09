import NativeKokoro from "kokoro/src/NativeKokoro"; 
import { VoiceListenerState } from "../components/VoiceListener";

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

interface TtsUtilsProps {
  text: string;
  voiceListenerState: VoiceListenerState;
  setVoiceListenerState: (state: VoiceListenerState) => void;
  activeTtsCountRef: React.RefObject<number>;
  setSpeaking: (speaking: boolean) => void;
}

export const speak = async ({
  text,
  voiceListenerState,
  setVoiceListenerState,
  activeTtsCountRef,
  setSpeaking,
}: TtsUtilsProps) => {
  const shouldRestoreListener = voiceListenerState !== 'disabled';
  activeTtsCountRef.current += 1;
  try {
    if (shouldRestoreListener && activeTtsCountRef.current === 1) {
      // Pause live mic/VAD while TTS is speaking to avoid iOS audio-session conflicts.
      setVoiceListenerState('disabled');
      await sleep(120);
    }
    await NativeKokoro.stop();
    setSpeaking(true);
    await NativeKokoro.speak(text, 1.0);
  } catch (e: any) {
    console.log('[Kokoro] speak error:', e.message);
  } finally {
    setSpeaking(false);
    activeTtsCountRef.current = Math.max(0, activeTtsCountRef.current - 1);
    if (shouldRestoreListener && activeTtsCountRef.current === 0) {
      setVoiceListenerState('listening');
    }
  }
};
