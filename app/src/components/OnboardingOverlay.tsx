import React, { useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface OnboardingOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const CARD_HORIZONTAL_PADDING = 24;

function WelcomeCard({ width }: { width: number }) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Work From Car</Text>
      <Text style={styles.subtitle}>
        Your hands-free email assistant for the road.
      </Text>

      <Text style={styles.sectionHeader}>How it works</Text>
      <View style={styles.stepsRow}>
        <View style={styles.stepCard}>
          <Text style={styles.stepNum}>1</Text>
          <Text style={styles.stepLabel}>Speak naturally</Text>
        </View>
        <Text style={styles.stepArrow}>→</Text>
        <View style={styles.stepCard}>
          <Text style={styles.stepNum}>2</Text>
          <Text style={styles.stepLabel}>AI understands intent</Text>
        </View>
        <Text style={styles.stepArrow}>→</Text>
        <View style={styles.stepCard}>
          <Text style={styles.stepNum}>3</Text>
          <Text style={styles.stepLabel}>Confirms before acting</Text>
        </View>
      </View>

      <View style={styles.calloutBox}>
        <Text style={styles.calloutText}>
          <Text style={styles.calloutBold}>Reads & searches</Text> run
          automatically.{' '}
          <Text style={styles.calloutBold}>Sending email</Text> always asks for
          your confirmation first.
        </Text>
      </View>
    </ScrollView>
  );
}

function CheckReadCard({ width }: { width: number }) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.cardTitle}>What you can say</Text>
      <Text style={styles.cardSubtitle}>Check & Read</Text>

      <View style={styles.capGroup}>
        <Text style={styles.capTitle}>Check emails</Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"Do I have any new emails?"</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"What emails did I get from Sarah?"</Text>
          </View>
        </View>
      </View>

      <View style={styles.capGroup}>
        <Text style={styles.capTitle}>Read an email</Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"Read me the first one"</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"What does it say?"</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function ComposeReplyCard({ width }: { width: number }) {
  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.cardTitle}>What you can say</Text>
      <Text style={styles.cardSubtitle}>Compose, Reply & Forward</Text>

      <View style={styles.capGroup}>
        <Text style={styles.capTitle}>Compose</Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"Draft an email to John about the meeting tomorrow"</Text>
          </View>
        </View>
      </View>

      <View style={styles.capGroup}>
        <Text style={styles.capTitle}>Reply</Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"Reply saying I'll be there at 3pm"</Text>
          </View>
        </View>
      </View>

      <View style={styles.capGroup}>
        <Text style={styles.capTitle}>Forward</Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"Forward that to my team"</Text>
          </View>
        </View>
      </View>

      <View style={styles.capGroup}>
        <Text style={styles.capTitle}>Find contacts</Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>"Send an email to Jake"</Text>
          </View>
        </View>
        <Text style={styles.capHint}>Names are auto-resolved to email addresses</Text>
      </View>
    </ScrollView>
  );
}

function TipsCard({ width }: { width: number }) {
  const tips = [
    'You can interrupt and correct the assistant anytime.',
    'Say a name instead of an email address — it will look up the contact for you.',
    'The assistant will ask for missing details one at a time.',
  ];

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.cardTitle}>Tips</Text>
      <Text style={styles.cardSubtitle}>Get the most out of it</Text>

      {tips.map((tip, i) => (
        <View key={i} style={styles.tipCard}>
          <Text style={styles.tipNum}>{i + 1}</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const TOTAL_CARDS = 4;

export default function OnboardingOverlay({ visible, onDismiss }: OnboardingOverlayProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      setActiveIndex(index);
    },
    [width],
  );

  const goNext = useCallback(() => {
    if (activeIndex < TOTAL_CARDS - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      onDismiss();
    }
  }, [activeIndex, width, onDismiss]);

  const handleDismiss = useCallback(() => {
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    onDismiss();
  }, [onDismiss]);

  const isLast = activeIndex === TOTAL_CARDS - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        {/* Skip */}
        <View style={styles.topRow}>
          <Pressable onPress={handleDismiss} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.carousel}
        >
          <WelcomeCard width={width} />
          <CheckReadCard width={width} />
          <ComposeReplyCard width={width} />
          <TipsCard width={width} />
        </ScrollView>

        {/* Footer: dots + button */}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>{isLast ? 'Got it' : 'Next'}</Text>
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
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  skipText: {
    color: 'rgba(232,255,246,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },

  carousel: {
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // Welcome card
  title: {
    color: '#e8fff6',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(232,255,246,0.5)',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 32,
  },
  sectionHeader: {
    color: 'rgba(34,197,94,0.75)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  stepCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  stepNum: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepLabel: {
    color: 'rgba(232,255,246,0.8)',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepArrow: {
    color: 'rgba(232,255,246,0.2)',
    fontSize: 16,
  },
  calloutBox: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  calloutText: {
    color: 'rgba(232,255,246,0.65)',
    fontSize: 13,
    lineHeight: 20,
  },
  calloutBold: {
    fontWeight: '700',
    color: 'rgba(232,255,246,0.85)',
  },

  // Shared card header
  cardTitle: {
    color: '#e8fff6',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: 'rgba(34,197,94,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 28,
  },

  // Capability groups
  capGroup: {
    marginBottom: 20,
  },
  capTitle: {
    color: 'rgba(229,231,235,0.9)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  capHint: {
    color: 'rgba(232,255,246,0.4)',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillText: {
    color: '#e5e7eb',
    fontSize: 13,
  },

  // Tips card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  tipNum: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '700',
    width: 20,
  },
  tipText: {
    color: 'rgba(232,255,246,0.75)',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 56,
    paddingTop: 12,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(232,255,246,0.15)',
  },
  dotActive: {
    backgroundColor: '#22c55e',
    width: 20,
    borderRadius: 4,
  },
  nextBtn: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  nextBtnText: {
    color: '#22c55e',
    fontSize: 15,
    fontWeight: '700',
  },
});
