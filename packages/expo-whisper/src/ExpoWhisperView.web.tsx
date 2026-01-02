import * as React from 'react';

import { ExpoWhisperViewProps } from './ExpoWhisper.types';

export default function ExpoWhisperView(props: ExpoWhisperViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
