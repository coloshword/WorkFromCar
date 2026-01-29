import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, useColorScheme, Animated } from "react-native";
import { 
  AudioModule,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { transcribeFile } from "expo-whisper";
import { styles } from "./styles";

interface VoiceRecorderProps {
  onTranscriptionComplete?: (transcription: string) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

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

  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recorderState.isRecording]);

  const handlePressIn = async () => {
    // Animate button press
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Start recording
    try {
      setTranscription(""); // Clear previous transcription
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const handlePressOut = async () => {
    // Animate button release
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Stop recording and transcribe
    try {
      await audioRecorder.stop();
      // Wait a moment for the file to be ready
      setTimeout(async () => {
        if (recorderState.url) {
          setIsTranscribing(true);
          try {
            let result = await transcribeFile(recorderState.url);
            setTranscription(result);
            onTranscriptionComplete?.(result);
          } catch (error) {
            Alert.alert('Error', 'Failed to transcribe audio.');
          } finally {
            setIsTranscribing(false);
          }
        }
      }, 100);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.buttonWrapper}>
        <Animated.View
          style={[
            styles.buttonPulse,
            recorderState.isRecording && styles.buttonPulseActive,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            recorderState.isRecording && styles.recordButtonActive,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.buttonInner,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.micIcon}>
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.instructionText, isDark && styles.instructionTextDark]}>
        {recorderState.isRecording
          ? "Recording... Release to transcribe"
          : "Hold to record"}
      </Text>

      {isTranscribing && (
        <View style={[styles.transcriptionContainer, isDark && styles.transcriptionContainerDark]}>
          <Text style={[styles.transcriptionText, isDark && styles.transcriptionTextDark]}>
            ✨ Transcribing...
          </Text>
        </View>
      )}

      {transcription && !isTranscribing ? (
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
