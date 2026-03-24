import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AgentTool } from '../../../types/Agent';

interface Props {
  tool: AgentTool | null;
}

const TOOL_ICONS: Record<string, string> = {
  'gmail.summarizeEmails': 'Inbox',
  'gmail.readEmail': 'Read',
  'gmail.createDraft': 'Draft',
  'gmail.resolveContact': 'Contact',
  'gmail.replyToEmail': 'Reply',
  'gmail.forwardEmail': 'Forward',
};

function SummarizeEmailsViz({ params }: { params: Record<string, string> }) {
  const query = params.query ?? 'is:unread';
  const maxResults = params.maxResults ?? '10';

  return (
    <View style={vizStyles.container}>
      <View style={vizStyles.row}>
        <View style={vizStyles.iconCircle}>
          <Text style={vizStyles.iconText}>Q</Text>
        </View>
        <View style={vizStyles.textBlock}>
          <Text style={vizStyles.label}>Query</Text>
          <Text style={vizStyles.value} numberOfLines={1}>{query}</Text>
        </View>
      </View>
      <View style={vizStyles.divider} />
      <View style={vizStyles.row}>
        <View style={vizStyles.iconCircle}>
          <Text style={vizStyles.iconText}>#</Text>
        </View>
        <View style={vizStyles.textBlock}>
          <Text style={vizStyles.label}>Max results</Text>
          <Text style={vizStyles.value}>{maxResults}</Text>
        </View>
      </View>
    </View>
  );
}

function ReadEmailViz({ params }: { params: Record<string, string> }) {
  const messageId = params.messageId ?? '';

  return (
    <View style={vizStyles.container}>
      <View style={vizStyles.row}>
        <View style={vizStyles.iconCircle}>
          <Text style={vizStyles.iconText}>ID</Text>
        </View>
        <View style={vizStyles.textBlock}>
          <Text style={vizStyles.label}>Message ID</Text>
          <Text style={vizStyles.value} numberOfLines={1}>{messageId}</Text>
        </View>
      </View>
    </View>
  );
}

function GenericToolViz({ tool }: { tool: AgentTool }) {
  if (!tool.toolParameters) return null;

  return (
    <View style={vizStyles.container}>
      {Object.entries(tool.toolParameters).map(([k, v]) => (
        <View key={k} style={vizStyles.row}>
          <View style={vizStyles.textBlock}>
            <Text style={vizStyles.label}>{k}</Text>
            <Text style={[vizStyles.value, !v && vizStyles.valueNull]} numberOfLines={2}>
              {v ?? 'null'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ToolVizContent({ tool }: { tool: AgentTool }) {
  const params = tool.toolParameters ?? {};

  switch (tool.tool) {
    case 'gmail.summarizeEmails':
      return <SummarizeEmailsViz params={params} />;
    case 'gmail.readEmail':
      return <ReadEmailViz params={params} />;
    default:
      return <GenericToolViz tool={tool} />;
  }
}

export default function ToolCallGlass({ tool }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const prevToolRef = useRef<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const toolName = tool?.tool ?? null;
    if (toolName !== prevToolRef.current) {
      contentFade.setValue(0);
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      prevToolRef.current = toolName;
    }
  }, [tool, contentFade]);

  const displayName = tool ? (TOOL_ICONS[tool.tool] ?? tool.tool) : null;

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
        <View style={styles.innerHighlight} />

        {tool ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.content, { opacity: contentFade }]}>
              <View style={styles.header}>
                <View style={styles.dotActive} />
                <Text style={styles.headerLabel}>{displayName}</Text>
                <View style={styles.toolBadge}>
                  <Text style={styles.toolBadgeText}>{tool.tool}</Text>
                </View>
              </View>
              <ToolVizContent tool={tool} />
            </Animated.View>
          </ScrollView>
        ) : (
          <View style={styles.emptyContent} />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const GLASS_HEIGHT = 240;

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '95%',
    marginTop: 24,
  },
  glass: {
    borderRadius: 22,
    overflow: 'hidden',
    height: GLASS_HEIGHT,
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  headerLabel: {
    flexShrink: 1,
    color: 'rgba(232, 255, 246, 0.9)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toolBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  toolBadgeText: {
    color: 'rgba(154, 164, 178, 0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
