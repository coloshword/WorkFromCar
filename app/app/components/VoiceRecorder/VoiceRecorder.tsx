import React, { useEffect, useState, useRef } from "react";
import { View, Text, Animated, useColorScheme, Alert } from "react-native";
import {
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import {
  startContinuousRecording,
  stopContinuousRecording,
  addVoiceStartListener,
  addVoiceStopListener,
  addTranscriptionCompleteListener,
} from "expo-whisper";
import { styles } from "./styles";

interface VoiceRecorderProps {
  onTranscriptionComplete?: (transcription: string) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isListening, setIsListening] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const eventListenersRef = useRef<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Request audio permissions
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert('Permission Required', 'Microphone permission is required for voice detection.');
          return;
        }
        
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        
        // Start continuous recording with VAD
        const started = startContinuousRecording();
        if (started) {
          setIsListening(true);
          console.log('🎤 VoiceRecorder: Continuous recording started');
        } else {
          console.error('🎤 VoiceRecorder: Failed to start continuous recording');
        }
      } catch (e) {
        console.error('🎤 VoiceRecorder: Audio initialization failed', e);
        Alert.alert('Error', 'Failed to initialize voice recording.');
      }
    })();

    return () => {
      // Cleanup: remove event listeners and stop recording
      eventListenersRef.current.forEach(listener => listener.remove());
      eventListenersRef.current = [];
      stopContinuousRecording();
      console.log('🎤 VoiceRecorder: Cleaned up continuous recording');
    };
  }, []);

  useEffect(() => {
    // Set up event listeners
    const voiceStartListener = addVoiceStartListener(() => {
      console.log('🎤 VoiceRecorder: Voice START detected');
      setIsRecordingVoice(true);
      setTranscription(""); // Clear previous transcription when new speech starts
    });

    const voiceStopListener = addVoiceStopListener(() => {
      console.log('🎤 VoiceRecorder: Voice STOP detected');
      setIsRecordingVoice(false);
      setIsTranscribing(true);
    });

    const transcriptionListener = addTranscriptionCompleteListener((event) => {
      console.log('🎤 VoiceRecorder: Transcription complete:', event.transcription);
      setTranscription(event.transcription);
      setIsTranscribing(false);
      
      // Call the callback with the transcription
      if (event.transcription && event.transcription.trim().length > 0) {
        onTranscriptionComplete?.(event.transcription);
      }
    });

    // Store listeners for cleanup
    eventListenersRef.current = [
      voiceStartListener,
      voiceStopListener,
      transcriptionListener,
    ];

    return () => {
      // This cleanup happens when the listeners need to be refreshed
      eventListenersRef.current.forEach(listener => listener.remove());
      eventListenersRef.current = [];
    };
  }, [onTranscriptionComplete]);

  // Pulsing animation for the voice indicator
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (isRecordingVoice) {
      // Fast, active pulse when recording voice
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    } else if (isListening) {
      // Gentle, slow pulse when listening but no voice detected
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
    } else {
      // Not listening - static
      pulseAnim.setValue(1);
      return;
    }

    animation.start();

    return () => {
      animation?.stop();
    };
  }, [isRecordingVoice, isListening, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Transcription Card */}
      <View style={styles.transcriptionCardContainer}>
        {isTranscribing ? (
          <View style={[styles.transcriptionCard, isDark && styles.transcriptionCardDark]}>
            <Text style={[styles.transcribingText, isDark && styles.transcribingTextDark]}>
              Transcribing...
            </Text>
          </View>
        ) : transcription ? (
          <View style={[styles.transcriptionCard, isDark && styles.transcriptionCardDark]}>
            <Text style={[styles.transcriptionLabel, isDark && styles.transcriptionLabelDark]}>
              Transcription
            </Text>
            <Text style={[styles.transcriptionContent, isDark && styles.transcriptionContentDark]}>
              {transcription}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Voice Indicator - Centered */}
      <View style={styles.voiceIndicatorContainer}>
        <Animated.View
          style={[
            styles.voiceIndicatorOuter,
            isRecordingVoice && styles.voiceIndicatorOuterActive,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={[
            styles.voiceIndicatorInner,
            isRecordingVoice && styles.voiceIndicatorInnerActive,
          ]} />
        </Animated.View>
        
        <Text style={[styles.statusText, isDark && styles.statusTextDark]}>
          {isRecordingVoice 
            ? "Recording..." 
            : isListening 
              ? "Listening..." 
              : "Initializing..."}
        </Text>
      </View>
    </View>
  );
}
