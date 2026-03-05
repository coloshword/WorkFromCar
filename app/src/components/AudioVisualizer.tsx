import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import type { VoiceListenerState } from './VoiceListener';

interface Props {
  mode?: VoiceListenerState;
}

const NUM_BARS = 5;
const MIN_HEIGHT = 6;
const MAX_HEIGHT = 60;
const BAR_OFFSETS = [0, 90, 170, 250, 340];
const SMOOTHING = 0.25;

function computeRms(frame: number[]): number {
  if (frame.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    const s = frame[i] / 32768.0;
    sum += s * s;
  }
  return Math.sqrt(sum / frame.length);
}

export default function AudioVisualizer({ mode = 'disabled' }: Props) {
  const animatedHeights = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(MIN_HEIGHT))
  ).current;

  const smoothedRmsRef = useRef(0);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const frameListener = (frame: number[]) => {
      const rms = computeRms(frame);
      smoothedRmsRef.current =
        SMOOTHING * rms + (1 - SMOOTHING) * smoothedRmsRef.current;

      const isSpeaking = modeRef.current === 'speaking';

      animatedHeights.forEach((anim, i) => {
        const targetHeight = isSpeaking
          ? MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * Math.min(smoothedRmsRef.current * 12, 1) *
            (0.5 + 0.5 * Math.sin((Date.now() / 80 + BAR_OFFSETS[i] * 0.01)))
          : MIN_HEIGHT;

        Animated.spring(anim, {
          toValue: targetHeight,
          useNativeDriver: false,
          damping: 12,
          stiffness: 180,
        }).start();
      });
    };

    VoiceProcessor.instance.addFrameListener(frameListener);

    return () => {
      VoiceProcessor.instance.removeFrameListener(frameListener);
    };
  }, [animatedHeights]);

  return (
    <View style={styles.root}>
      <View style={styles.wave}>
        {animatedHeights.map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.bar, { height: anim }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    height: MAX_HEIGHT + 4,
  },
  bar: {
    width: 6,
    borderRadius: 999,
    backgroundColor: '#e8fff6',
    opacity: 0.75,
  },
});
