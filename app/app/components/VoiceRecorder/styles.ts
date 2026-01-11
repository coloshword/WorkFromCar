import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
    alignItems: "center",
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
});
