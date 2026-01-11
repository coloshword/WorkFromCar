import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, useColorScheme } from "react-native";
import { 
  AudioModule,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { transcribeFile } from "expo-whisper";
import { styles } from "./styles";

export default function VoiceRecorder() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [transcription, setTranscription] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        // Request audio permissions
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
          return;
        }
        
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (e) {
        console.error('Audio initialization failed', e);
        Alert.alert('Error', 'Failed to initialize audio recording.');
      }
    })();
  }, []);

  const record = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const transcribeVoice = async () => {
    if (!recorderState.url) {
      Alert.alert('No Recording', 'Please record audio first.');
      return;
    }

    try {
      const result = await transcribeFile(recorderState.url);
      setTranscription(result);
    } catch (error) {
      console.error('Transcription failed', error);
      Alert.alert('Error', 'Failed to transcribe audio.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.titleDark]}>Voice Recorder</Text>
      
      <TouchableOpacity
        style={[
          styles.recordButton,
          recorderState.isRecording ? styles.recordButtonActive : styles.recordButtonInactive
        ]}
        onPress={() => {
          recorderState.isRecording ? stopRecording() : record();
        }}
      >
        <Text style={[styles.buttonText, recorderState.isRecording && styles.buttonTextActive]}>
          {recorderState.isRecording ? "⏹ Stop Recording" : "🎤 Record Voice"}
        </Text>
      </TouchableOpacity>

      {recorderState.url && !recorderState.isRecording && (
        <TouchableOpacity
          style={styles.transcribeButton}
          onPress={transcribeVoice}
        >
          <Text style={styles.buttonText}>✨ Transcribe</Text>
        </TouchableOpacity>
      )}

      {transcription ? (
        <View style={[styles.transcriptionContainer, isDark && styles.transcriptionContainerDark]}>
          <Text style={[styles.transcriptionTitle, isDark && styles.titleDark]}>
            Transcription:
          </Text>
          <Text style={[styles.transcriptionText, isDark && styles.transcriptionTextDark]}>
            {transcription}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
