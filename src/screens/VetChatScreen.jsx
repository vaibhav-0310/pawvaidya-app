import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import { ArrowLeft, Send, Video } from 'lucide-react-native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api_essentials';

const SOCKET_URL = 'https://pawvaidya-jgei.onrender.com';

export default function VetChatScreen({ navigation, route }) {
  const vet = route?.params?.vet || {};
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [chatError, setChatError] = useState('');
  const socketRef = useRef(null);
  const listRef = useRef(null);

  const { user, initializing } = useAuth();
  const currentUser = useMemo(() => ({
    id: user?._id || user?.id || user?.username || 'demo-user',
    name: 'Pet Parent',
    type: 'user',
  }), [user]);

  useEffect(() => {
    let cancelled = false;
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
    });

    socketRef.current = socket;

    const loadChat = async () => {
      if (initializing) return;

      const userId = user?._id || user?.id;
      const vetId = vet._id;

      if (!userId || !vetId) {
        setChatError('Please log in before starting a vet chat.');
        return;
      }

      try {
        setChatError('');
        const { data: chat } = await api.post('/chat/create', { userId, vetId });
        if (cancelled) return;

        setChatId(chat._id);
        setMessages((chat.messages || []).map((message) => ({
          _id: message._id,
          senderType: message.senderType,
          content: message.content,
        })));
        socket.emit('join-chat', chat._id);
      } catch (error) {
        if (!cancelled) {
          setChatError(error.response?.data?.error || 'Unable to load this conversation.');
        }
      }
    };

    loadChat();

    socket.on('connect', () => {
      setConnected(true);
      setConnectionError('');
    });

    socket.on('receive-message', ({ messageId, sender, content, senderType, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: messageId || `${Date.now()}-${sender || 'socket'}`,
          sender,
          senderType,
          content,
          timestamp,
        },
      ]);
    });

    socket.on('error', (message) => setChatError(message || 'Message could not be sent.'));

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (error) => {
      setConnected(false);
      setConnectionError(error?.message || 'Unable to connect to vet chat.');
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [currentUser, initializing, user, vet._id, vet.name]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socketRef.current?.connected || !chatId) return;

    socketRef.current.emit('send-message', {
      chatId,
      senderId: currentUser.id,
      senderType: currentUser.type,
      content: text,
    });
    setInput('');
  };

  const renderItem = ({ item }) => {
    const isUser = item.senderType === 'user';

    return (
      <View style={[styles.bubbleWrap, isUser ? styles.userWrap : styles.vetWrap]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.vetBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{vet.name || 'Vet support'}</Text>
          <Text style={styles.headerStatus}>{chatError || (connected ? 'Online now' : connectionError || 'Connecting...')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('VetCall', { vet, chatId })}
          style={styles.videoButton}
          accessibilityRole="button"
        >
          <Video size={18} color={colors.buttonText} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            style={styles.input}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!input.trim() || !connected}>
            <Send size={18} color={colors.buttonText} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.cardBg,
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginHorizontal: 12 },
  headerName: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  headerStatus: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  videoButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 14, paddingBottom: 20 },
  bubbleWrap: { marginBottom: 12, flexDirection: 'row' },
  userWrap: { justifyContent: 'flex-end' },
  vetWrap: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  userBubble: { backgroundColor: colors.primaryDark, borderBottomRightRadius: 4 },
  vetBubble: { backgroundColor: colors.cardBg, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.cardBorder },
  messageText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  userMessageText: { color: colors.buttonText },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.cardBg,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: 10,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
