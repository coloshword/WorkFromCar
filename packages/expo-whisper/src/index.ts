// Reexport the native module. On web, it will be resolved to ExpoWhisperModule.web.ts
// and on native platforms to ExpoWhisperModule.ts
export { default } from './ExpoWhisperModule';
export { default as ExpoWhisperView } from './ExpoWhisperView';
export * from  './ExpoWhisper.types';
