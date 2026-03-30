import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AgentTool } from '../../../types/Agent';

interface Props {
  tool: AgentTool | null;
}

export default function ToolIndicator({ tool }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.12)',
          'rgba(255, 255, 255, 0.04)',
          'rgba(255, 255, 255, 0.08)',
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glass}
      >
      <Text>Sample tool</Text>
      </LinearGradient>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '95%',
    marginTop: 24,
  },
  glass: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 240,
    padding: 18,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
