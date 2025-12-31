import { NativeModules } from 'react-native';

interface WhisperModuleInterface {
  transcribeAudioFile(filePath: string): Promise<string>;
}

const { WhisperModule } = NativeModules;

if (!WhisperModule) {
  throw new Error(
    'WhisperModule native module is not available. Make sure the native module is properly linked.'
  );
}

/**
 * Transcribes an audio file to text using Whisper.
 * 
 * @param filePath - Path to the audio file. Can be a local file path or a file:// URI.
 * @returns Promise that resolves to the transcribed text string.
 * @throws Error if the transcription fails or the file cannot be processed.
 * 
 * @example
 * ```typescript
 * try {
 *   const text = await transcribeAudioFile('/path/to/audio.m4a');
 *   console.log('Transcribed text:', text);
 * } catch (error) {
 *   console.error('Transcription failed:', error);
 * }
 * ```
 */
export async function transcribeAudioFile(filePath: string): Promise<string> {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('filePath must be a non-empty string');
  }

  try {
    const result = await (WhisperModule as WhisperModuleInterface).transcribeAudioFile(filePath);
    return result;
  } catch (error: any) {
    // Re-throw with more context if available
    if (error?.message) {
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
    throw error;
  }
}

export default {
  transcribeAudioFile,
};

