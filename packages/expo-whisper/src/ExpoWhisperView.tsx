import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoWhisperViewProps } from './ExpoWhisper.types';

const NativeView: React.ComponentType<ExpoWhisperViewProps> =
  requireNativeView('ExpoWhisper');

export default function ExpoWhisperView(props: ExpoWhisperViewProps) {
  return <NativeView {...props} />;
}
