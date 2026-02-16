import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authFetch } from "../utils/fetchUtils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DemoScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [planOrExecute, setPlanOrExecute] = useState<'plan' | 'execute'>('plan');
  const [executeObj, setExecuteObj] = useState<any>(null);
  const [statusText, setStatusText] = useState("");

  const sendMessage = async () => {
    // In execute mode, we don't necessarily need input text if the plan is already set
    if (planOrExecute === 'plan' && !inputText.trim()) return;

    setLoading(true);
    setStatusText("Sending...");

    try {
      let updatedMessages = [...messages];
      
      if (planOrExecute === 'plan') {
        const userMessage: Message = { role: 'user', content: inputText.trim() };
        updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText("");
      }

      let response;
      if (planOrExecute === 'execute') {
        response = await authFetch("/api/agent/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(executeObj),
        });
      } else {
        response = await authFetch("/api/agent/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (planOrExecute === 'execute') {
        setPlanOrExecute('plan');
        setExecuteObj(null);
        setStatusText("✓ Tool executed successfully");
        if (data.message) {
            setMessages(prev => [...prev, data.message]);
        }
      } else {
        const assistantMessage = data.message;
        setMessages(prev => [...prev, assistantMessage]);
        setStatusText(`✓ Response received (tool: ${data.tool.tool})`);

        if (data.tool.toolParameters && Object.values(data.tool.toolParameters).every(param => param !== null)) {
          setPlanOrExecute('execute');
          setExecuteObj({
            messages: [...updatedMessages, assistantMessage],
            tool: data.tool,
          });
          setStatusText(`✓ Plan ready. Next message will execute: ${data.tool.tool}`);
        }
      }
    } catch (error: any) {
      console.error(error);
      setStatusText(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.messagesContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg, index) => (
          <View key={index} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={styles.messageRole}>{msg.role}:</Text>
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 10 }} />}
      </ScrollView>

      {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={planOrExecute === 'execute' ? "Tap send to execute plan..." : "Send a chat..."}
          value={inputText}
          onChangeText={setInputText}
          editable={!loading && planOrExecute === 'plan'}
        />
        <Pressable style={[styles.sendButton, loading && styles.disabledButton]} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendButtonText}>{planOrExecute === 'execute' ? "Execute" : "Send"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  messageRole: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  messageText: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: 'cyan',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default DemoScreen;
