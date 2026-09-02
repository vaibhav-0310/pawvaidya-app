import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { io } from 'socket.io-client';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = 'https://pawvaidya-jgei.onrender.com';

export default function VetCallScreen({ navigation, route }) {
  const vet = route?.params?.vet || {};
  const socketRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [callStatus, setCallStatus] = useState('Calling...');
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setError('');
      setCallStatus('Calling...');
      socket.emit('hcp-video-call-request', {
        vetId: vet._id || 'demo-vet',
        chatId: `chat-${vet._id || 'demo'}-demo-user`,
        senderId: user?._id || user?.id || user?.username || 'demo-user',
        senderName: user?.name || user?.username || 'Pet Parent',
      });
    });

    socket.on('hcp-video-call-accepted', () => {
      setCallStatus('Call accepted');
    });

    socket.on('hcp-video-call-rejected', () => {
      setCallStatus('Call declined');
      setError('The vet is not available right now.');
    });

    socket.on('disconnect', () => {
      setCallStatus('Disconnected');
    });
    socket.on('connect_error', (connectionError) => {
      setCallStatus('Connection failed');
      setError(connectionError?.message || 'Unable to connect to vet calling.');
    });

    return () => socket.disconnect();
  }, [user, vet._id]);

  const endCall = () => {
    socketRef.current?.disconnect();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.vidPanel}>
        <Text style={styles.header}>Video consult</Text>
        <Text style={styles.name}>{vet.name || 'Vet support'}</Text>
        <Text style={styles.status}>{callStatus}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setIsMuted((v) => !v)}>
          {isMuted ? <MicOff size={24} color={colors.buttonText} /> : <Mic size={24} color={colors.buttonText} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.hangupButton} onPress={endCall}>
          <PhoneOff size={26} color={colors.buttonText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => setCameraOn((v) => !v)}>
          {cameraOn ? <Video size={24} color={colors.buttonText} /> : <VideoOff size={24} color={colors.buttonText} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'space-between',
  },
  vidPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    color: colors.buttonText,
    fontSize: 24,
    fontWeight: '800',
  },
  name: {
    marginTop: 12,
    color: colors.buttonText,
    fontSize: 30,
    fontWeight: '700',
  },
  status: {
    marginTop: 8,
    color: '#D1D5DB',
    fontSize: 16,
  },
  error: {
    marginTop: 12,
    color: '#FDA4AF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 34,
    gap: 22,
  },
  controlButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
