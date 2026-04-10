import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import EmailLogo from './icons/emailLogo';
import CalendarLogo from './icons/calendarLogo';
import FindLogo from './icons/findLogo';
import { AgentTool } from '../../../types/Agent';

const ICON_COLOR = '#22c55e';
const ICON_SIZE = 18;

const TOOL_ICONS: Record<string, React.ReactElement> = {
  'gmail.summarizeEmails': <EmailLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gmail.readEmail':       <EmailLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gmail.createDraft':     <EmailLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gmail.resolveContact':  <FindLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gmail.replyToEmail':    <EmailLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gmail.forwardEmail':    <EmailLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gcal.createEvent':      <CalendarLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gcal.getEvents':        <CalendarLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gcal.respondToEvent':   <CalendarLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gcal.updateEvent':      <CalendarLogo size={ICON_SIZE} color={ICON_COLOR} />,
  'gcal.deleteEvent':      <CalendarLogo size={ICON_SIZE} color={ICON_COLOR} />,
};

function ToolIcon({ toolName }: { toolName: string }) {
  return TOOL_ICONS[toolName] ?? <EmailLogo size={ICON_SIZE} color={ICON_COLOR} />;
}

const TOOL_LABELS: Record<string, string> = {
  'gmail.summarizeEmails': 'Inbox',
  'gmail.readEmail': 'Inbox',
  'gmail.createDraft': 'Inbox',
  'gmail.resolveContact': 'Contacts',
  'gmail.replyToEmail': 'Inbox',
  'gmail.forwardEmail': 'Inbox',
  'gcal.createEvent': 'Calendar',
  'gcal.getEvents': 'Calendar',
  'gcal.respondToEvent': 'Calendar',
  'gcal.updateEvent': 'Calendar',
  'gcal.deleteEvent': 'Calendar',
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
  const tool = toolProp;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const prevToolKey = useRef<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const toolKey = tool?.tool
      ? `${tool.tool}:${JSON.stringify(tool.toolParameters)}`
      : null;
    if (toolKey !== prevToolKey.current) {
      contentFade.setValue(0);
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      prevToolKey.current = toolKey;
    }
  }, [tool, contentFade]);

  if (!tool?.tool) {
    return null;
  }

  const displayName = TOOL_LABELS[tool.tool] ?? tool.tool;

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
          <Animated.View style={{ opacity: contentFade }}>
            <View style={styles.header}>
              <ToolIcon toolName={tool.tool} />
              <Text style={styles.headerLabel}>{displayName}</Text>
              <View style={styles.toolBadge}>
                <Text style={styles.toolBadgeText}>{tool.tool}</Text>
              </View>
            </View>
            <GenericToolViz tool={tool} />
          </Animated.View>
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    flexShrink: 1,
    color: 'rgba(232, 255, 246, 0.9)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toolBadge: {
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
});
