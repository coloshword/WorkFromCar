import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native';

export default function VoiceDashboard2() {
  return (
    <View style={styles.root}>
      <View style={styles.topbar}>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0f17',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
topbar: {
  height: 80,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  backgroundColor: 'rgba(15,23,42,0.35)',
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.08)',
},
});
