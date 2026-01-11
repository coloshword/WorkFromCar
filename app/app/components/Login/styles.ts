import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoDark: {
    opacity: 0.9,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  titleDark: {
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  subtitleDark: {
    color: "#999",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 12,
    backgroundColor: "#fff",
    color: "#4285F4",
    width: 28,
    height: 28,
    textAlign: "center",
    lineHeight: 28,
    borderRadius: 14,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  messageContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageContainerDark: {
    backgroundColor: "#1c1c1e",
  },
  messageText: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  messageTextDark: {
    color: "#fff",
  },
});