import React, { useState } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { startStreaming, stopStreaming } from "../services/audio/voiceProcessor";
import NativeWhisper from 'whisper/src/NativeWhisper';

interface Props {
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceListener({ onTranscript, disabled }: Props) {

  return (
    <View style={styles.content}>
      <Text style={styles.text}>
        Voice Listener component
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  idle: {
    backgroundColor: '#2196F3',
  },
  recording: {
    backgroundColor: '#F44336',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 10,
  },
  indicatorActive: {
    backgroundColor: '#FFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  text: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
