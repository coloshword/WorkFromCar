export type ExpoWhisperModuleEvents = {
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onTranscriptionComplete: (event: { transcription: string; filePath: string }) => void;
};
