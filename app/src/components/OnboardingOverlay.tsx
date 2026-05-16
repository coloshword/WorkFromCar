import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

interface OnboardingOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const EXAMPLES = [
  '"Do I have any new emails?"',
  '"Reply saying I\'ll be there at 3"',
  '"What\'s on my calendar today?"',
  '"Add a meeting with Jake Friday at 2"',
];

export default function OnboardingOverlay({ visible, onDismiss }: OnboardingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <Text style={styles.title}>Work From Car</Text>
          <Text style={styles.tagline}>Talk to your email and calendar.</Text>

          <Text style={styles.sectionLabel}>Try saying</Text>
          <View style={styles.examples}>
            {EXAMPLES.map((line) => (
              <Text key={line} style={styles.exampleText}>
                {line}
              </Text>
            ))}
          </View>

          <Text style={styles.promise}>I'll ask before sending anything.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,17,14,0.97)',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#e8fff6',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tagline: {
    color: 'rgba(232,255,246,0.55)',
    fontSize: 16,
    marginTop: 6,
    marginBottom: 40,
  },
  sectionLabel: {
    color: 'rgba(34,197,94,0.75)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  examples: {
    gap: 14,
    marginBottom: 36,
  },
  exampleText: {
    color: '#e8fff6',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
  promise: {
    color: 'rgba(232,255,246,0.55)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 56,
    paddingTop: 12,
  },
  button: {
    paddingHorizontal: 56,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  buttonText: {
    color: '#22c55e',
    fontSize: 15,
    fontWeight: '700',
  },
});
