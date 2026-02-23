import { VoiceProcessor, VoiceProcessorFrameListener } from '@picovoice/react-native-voice-processor';

/**
 * PCM buffer is a chunk of raw audio samples stored in memory (so we are going to skip the file )
 * a frame listener is a callback function called every time a new audio frame is available in the microphone
 * so new frame--> the frame listener calls this callback function
 * frameListener is called every time a new audio frame is avialable, so we have a new frame
 * available so our callback function should just push that to the pcmBuffer!
 * and frame is a number array, so we want to push the entire arry in order
 */


let frameListener: VoiceProcessorFrameListener | null = null;
let pcmBuffer: number[] = [];

export const FREQUENCY_HZ = 16000;
export const FRAME_LENGTH = 512;

export async function startStreaming() {
  // instance creates a singleton, the first time you access it and returns the same instance every time.
  pcmBuffer = [];

  frameListener = (frame: number[]) => {
    pcmBuffer.push(...frame);
  };

  // add this frame listener to the instanced 
  VoiceProcessor.instance.addFrameListener(frameListener);
  // start the voice processor 
  await VoiceProcessor.instance.start(FRAME_LENGTH, FREQUENCY_HZ);
}

/**
 * to stop streaming we need to remove the frameListener from the instance, and also reset the frameListener
 * we should also reutrn the set pcmBuffer
 * but first we need to actually stop the VoiceProcessor singleton
 */
export async function stopStreaming() {
  await VoiceProcessor.instance.stop();

  if (frameListener) {
    VoiceProcessor.instance.removeFrameListener(frameListener);
    frameListener = null;
  }
  
  const result = pcmBuffer;
  pcmBuffer = [];
  return result;
}
