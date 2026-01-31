import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  
  // Transcription Card Styles
  transcriptionCardContainer: {
    width: "100%",
    marginBottom: 40,
    minHeight: 80,
  },
  transcriptionCard: {
    width: "100%",
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  transcriptionCardDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#2c2c2e",
    shadowColor: "#000",
    shadowOpacity: 0.2,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcriptionLabelDark: {
    color: "#98989f",
  },
  transcriptionContent: {
    fontSize: 17,
    lineHeight: 24,
    color: "#000000",
    fontWeight: "400",
  },
  transcriptionContentDark: {
    color: "#ffffff",
  },
  transcribingText: {
    fontSize: 17,
    color: "#8e8e93",
    fontStyle: "italic",
    textAlign: "center",
  },
  transcribingTextDark: {
    color: "#98989f",
  },
  
  // Voice Indicator Styles - Centered, Modern
  voiceIndicatorContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  voiceIndicatorOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceIndicatorOuterActive: {
    backgroundColor: "rgba(255, 59, 48, 0.25)",
  },
  voiceIndicatorInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007aff",
    shadowColor: "#007aff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  voiceIndicatorInnerActive: {
    backgroundColor: "#ff3b30",
    shadowColor: "#ff3b30",
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  
  // Status Text
  statusText: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: "500",
    color: "#8e8e93",
    letterSpacing: 0.3,
  },
  statusTextDark: {
    color: "#98989f",
  },
  
  // Legacy styles (keeping for backward compatibility)
  buttonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonPulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "transparent",
  },
  buttonPulseActive: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: "#ff3b30",
  },
  buttonInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  micIcon: {
    fontSize: 40,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  instructionTextDark: {
    color: "#999",
  },
  transcriptionContainer: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  transcriptionContainerDark: {
    backgroundColor: "#2c2c2e",
    borderColor: "#3a3a3c",
  },
  transcriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  transcriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
  transcriptionTextDark: {
    color: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 32,
    color: "#000",
    textAlign: "center",
  },
  titleDark: {
    color: "#fff",
  },
});
