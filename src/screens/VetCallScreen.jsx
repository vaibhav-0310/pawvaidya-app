import React, { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { io } from 'socket.io-client';
import {
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  RTCPeerConnection,
} from 'react-native-webrtc';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api_essentials';

const SOCKET_URL = 'https://pawvaidya-jgei.onrender.com';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function VetCallScreen({ navigation, route }) {
  const vet = route?.params?.vet || {};
  const { user, initializing } = useAuth();
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const targetRef = useRef(null);
  const localStreamRef = useRef(null);
  // Candidates that arrive before remoteDescription is set must be queued,
  // not applied immediately — applying them early is what triggers the
  // native abort() in libjingle_peerconnection_so.so (RTC_CHECK failure
  // on the network_thread).
  const pendingCandidatesRef = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [chatId, setChatId] = useState(route?.params?.chatId || null);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [error, setError] = useState('');

  const userId = user?._id || user?.id;
  const roomId = chatId;

  // Keep a live reference to the display name WITHOUT putting the whole
  // `user` object in the main effect's dependency array. If AuthContext
  // hands back a new `user` object reference on unrelated re-renders, we
  // don't want that tearing down and rebuilding the entire call/socket/peer
  // setup mid-call.
  const userNameRef = useRef(user?.name || user?.username || 'Pet Parent');
  useEffect(() => {
    userNameRef.current = user?.name || user?.username || 'Pet Parent';
  }, [user]);

  const vetId = vet._id;

  useEffect(() => {
    if (initializing || !userId || !vetId) return undefined;

    if (!roomId) {
      let cancelled = false;
      api.post('/chat/create', { userId, vetId })
        .then(({ data: chat }) => {
          if (!cancelled) setChatId(chat._id);
        })
        .catch((roomError) => {
          setError(roomError.response?.data?.error || 'Unable to create the consultation room.');
          setCallStatus('Call unavailable');
        });
      return () => { cancelled = true; };
    }

    let cancelled = false;
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
    });
    socketRef.current = socket;
    let requestedTargetId = null;

    const prepareLocalMedia = async () => {
      // Only reuse an existing stream if it's actually still live — a
      // stream whose tracks were already .stop()'d by a previous cleanup
      // is useless and must not be handed back.
      if (localStreamRef.current) {
        const stillLive = localStreamRef.current
          .getTracks()
          .some((track) => track.readyState === 'live');
        if (stillLive) return localStreamRef.current;
        localStreamRef.current = null;
      }

      if (Platform.OS === 'android') {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        const granted = permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
          && permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        if (!granted) throw new Error('Camera and microphone permissions are required for video calls.');
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: 640,
          height: 480,
          frameRate: 24,
        },
      });
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    };

    const createPeer = async (targetId) => {
      // Only reuse an existing peer if it hasn't already been torn down.
      // A closed RTCPeerConnection is native-dead — calling addTrack/
      // createOffer/setLocalDescription on it is what triggers the native
      // abort in libjingle_peerconnection_so.so.
      if (peerRef.current && peerRef.current.signalingState !== 'closed') {
        return peerRef.current;
      }
      peerRef.current = null;
      pendingCandidatesRef.current = [];

      let peer;
      try {
        peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      } catch (peerError) {
        setError(peerError?.message || 'Unable to initialize the video connection.');
        setCallStatus('Call unavailable');
        throw peerError;
      }
      peerRef.current = peer;
      targetRef.current = targetId;
      peer.onicecandidate = ({ candidate }) => {
        if (candidate && targetRef.current) socket.emit('ice-candidate', { to: targetRef.current, candidate });
      };
      peer.ontrack = ({ streams }) => {
        if (streams[0]) setRemoteStream(streams[0]);
      };
      peer.onconnectionstatechange = () => {
        if (['connected', 'completed'].includes(peer.connectionState)) setCallStatus('Connected');
        if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) setCallStatus('Call ended');
      };

      const stream = await prepareLocalMedia();

      // The effect that owns this peer may have been cleaned up while we
      // were awaiting getUserMedia (e.g. an unrelated re-render, screen
      // unmount, or a second call attempt). If so, this peer is already
      // closed — do not touch it any further.
      if (cancelled) {
        peer.close();
        if (peerRef.current === peer) peerRef.current = null;
        return null;
      }

      if (!stream) return peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      return peer;
    };

    // Applies any ICE candidates that arrived before remoteDescription was
    // set. Must run right after a successful setRemoteDescription call.
    const flushPendingCandidates = async (peer) => {
      const queued = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];
      for (const candidate of queued) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (candidateError) {
          // A single bad/late candidate should never take down the call.
          console.warn('Failed to apply queued ICE candidate', candidateError);
        }
      }
    };

    const requestCall = (targetId) => {
      if (!targetId || requestedTargetId === targetId) return;
      requestedTargetId = targetId;
      targetRef.current = targetId;
      socket.emit('call-request', {
        to: targetId,
        userName: userNameRef.current,
        chatId: roomId,
      });
      setCallStatus('Calling the vet...');
    };

    socket.on('connect', () => {
      setCallStatus('Waiting for the vet...');
      socket.emit('join-chat', roomId);
      socket.emit('join-room', {
        roomId,
        userName: userNameRef.current,
      });
    });

    socket.on('room-peers', async (peers) => {
      const target = peers?.[0]?.socketId;
      if (!target) {
        setCallStatus('Waiting for the vet...');
        return;
      }
      requestCall(target);
    });

    socket.on('peer-joined', ({ socketId }) => requestCall(socketId));

    socket.on('call-accepted', async ({ from }) => {
      try {
        const peer = await createPeer(from);
        if (cancelled || !peer || peer.signalingState === 'closed') return;

        const offer = await peer.createOffer({});
        if (cancelled || peer.signalingState === 'closed') return;

        await peer.setLocalDescription(offer);
        if (cancelled || peer.signalingState === 'closed') return;

        socket.emit('offer', { to: from, offer });
        setCallStatus('Connecting video...');
      } catch (callError) {
        if (!cancelled) {
          setError(callError?.message || 'Camera or microphone permission was denied.');
          setCallStatus('Call unavailable');
        }
      }
    });

    socket.on('answer', async ({ answer }) => {
      if (cancelled) return;
      const peer = peerRef.current;
      // Only apply the answer once, and only while we're actually
      // expecting one. Re-applying an answer (duplicate/late socket
      // event) when signalingState is already 'stable' is exactly the
      // kind of invalid state transition that aborts the native layer.
      if (!peer || peer.signalingState !== 'have-local-offer') return;

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        if (cancelled || peerRef.current !== peer || peer.signalingState === 'closed') return;
        await flushPendingCandidates(peer);
      } catch (answerError) {
        if (!cancelled) {
          setError(answerError?.message || 'Unable to connect the call.');
          setCallStatus('Call unavailable');
        }
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (cancelled || !candidate) return;
      const peer = peerRef.current;
      if (!peer || peer.signalingState === 'closed') return;

      // Buffer until remoteDescription exists — applying a candidate
      // before that is what crashes the native WebRTC network thread.
      if (!peer.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (candidateError) {
        console.warn('Failed to apply ICE candidate', candidateError);
      }
    });

    socket.on('call-rejected', () => {
      setCallStatus('Call declined');
      setError('The vet is not available right now.');
    });
    socket.on('connect_error', (connectionError) => {
      setCallStatus('Connection failed');
      setError(connectionError?.message || 'Unable to connect to vet calling.');
    });

    return () => {
      cancelled = true;

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      peerRef.current?.close();
      peerRef.current = null;
      pendingCandidatesRef.current = [];

      targetRef.current = null;

      socket.disconnect();
    };
    // NOTE: intentionally NOT depending on the whole `user` object — only
    // on the primitives that should actually restart the call setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing, roomId, userId, vetId]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setIsMuted(nextMuted);
    socketRef.current?.emit('media-state', { video: cameraOn, audio: !nextMuted });
  };

  const toggleCamera = () => {
    const nextCameraOn = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = nextCameraOn; });
    setCameraOn(nextCameraOn);
    socketRef.current?.emit('media-state', { video: nextCameraOn, audio: !isMuted });
  };

  const endCall = () => {
    socketRef.current?.disconnect();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.videoStage}>
        {remoteStream ? <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" /> : null}
        {localStream ? <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" mirror /> : null}
        {!remoteStream ? (
          <View style={styles.waiting}>
            <Text style={styles.header}>Video consult</Text>
            <Text style={styles.name}>{vet.name || 'Vet support'}</Text>
            <Text style={styles.status}>{callStatus}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          {isMuted ? <MicOff size={24} color={colors.buttonText} /> : <Mic size={24} color={colors.buttonText} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.hangupButton} onPress={endCall}>
          <PhoneOff size={26} color={colors.buttonText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          {cameraOn ? <Video size={24} color={colors.buttonText} /> : <VideoOff size={24} color={colors.buttonText} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  videoStage: { flex: 1, position: 'relative' },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  localVideo: { position: 'absolute', right: 16, top: 16, width: 120, height: 170, borderRadius: 12, overflow: 'hidden' },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { color: colors.buttonText, fontSize: 24, fontWeight: '800' },
  name: { marginTop: 12, color: colors.buttonText, fontSize: 30, fontWeight: '700' },
  status: { marginTop: 8, color: '#D1D5DB', fontSize: 16 },
  error: { marginTop: 12, color: '#FDA4AF', fontSize: 14, textAlign: 'center', paddingHorizontal: 28 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 34, gap: 22 },
  controlButton: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  hangupButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center' },
});