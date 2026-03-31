import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AgentTool } from '../../../types/Agent';

const DEV_MOCK_TOOL: AgentTool = {
  tool: 'gmail.summarizeEmails',
  toolParameters: {
    query: 'is:unread',
    maxResults: 'This is some really long text that should wrap around to the next line',
  },
};

interface Props {
  tool: AgentTool | null;
}


function GenericToolViz({ tool }: { tool: AgentTool }) {
  if (!tool.toolParameters) return null;

  return (
    <View style={vizStyles.container}>
      {Object.entries(tool.toolParameters).map(([k, v]) => (
        <View key={k} style={vizStyles.row}>
          <View style={vizStyles.textBlock}>
            <Text style={vizStyles.label}>{k}</Text>
            <Text style={[vizStyles.value, !v && vizStyles.valueNull]}>
              {v ?? 'null'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}


const vizStyles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: 'rgba(232, 255, 246, 0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: 'rgba(154, 164, 178, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  valueNull: {
    color: 'rgba(229, 231, 235, 0.4)',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 4,
  },
});

export default function ToolIndicator({ tool: toolProp }: Props) {
  const tool = toolProp ?? DEV_MOCK_TOOL;
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <GenericToolViz tool={tool} />
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '90%',
    marginTop: 24,
  },
  glass: {
    overflow: 'hidden',
    height: 240,
    borderRadius: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
  },
});
