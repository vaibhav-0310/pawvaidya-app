import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } from '@react-native-documents/picker';
import { CheckCircle, ChevronRight, FileText, RefreshCw, Upload, XCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import api from '../services/api_essentials';

const supportedTypes = [
  types.pdf,
  types.doc,
  types.docx,
  types.images,
  types.xls,
  types.xlsx,
];

const formatSize = (bytes) => {
  if (!bytes) return 'Size unavailable';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString();
};

const titleFromName = (name = '') => name.replace(/\.[^/.]+$/, '') || 'Medical document';

export default function PhrScreen({ navigation }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [phrList, setPhrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchPhrs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get('/user/phrs');
      setPhrList(Array.isArray(data) ? data : data?.phrs || []);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load your files. Please try again.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPhrs();
  }, [fetchPhrs]);

  const chooseFile = async () => {
    try {
      const [selected] = await pick({ type: supportedTypes, allowMultiSelection: false });
      let localUri = selected.uri;
      try {
        const [copy] = await keepLocalCopy({
          files: [{ uri: selected.uri, fileName: selected.name || 'medical-document' }],
          destination: 'cachesDirectory',
        });
        if (copy.status === 'success' && copy.localUri) localUri = copy.localUri;
      } catch (copyError) {
        // Some providers do not support copying; the original content URI can still be uploaded.
      }
      const fileWithLocalUri = { ...selected, uri: localUri };
      setFile(fileWithLocalUri);
      setTitle((current) => current.trim() || titleFromName(selected.name));
      setMessage(null);
    } catch (error) {
      if (!(isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED)) {
        setMessage({ type: 'error', text: 'Unable to select that file.' });
      }
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setMessage({ type: 'warning', text: 'Choose a file before uploading.' });
      return;
    }
    if (!title.trim()) {
      setMessage({ type: 'warning', text: 'Enter a title for your document.' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: file.fileCopyUri || file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name || 'medical-document',
    });
    formData.append('title', title.trim());

    try {
      await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      setTitle('');
      setMessage({ type: 'success', text: 'File uploaded successfully.' });
      await fetchPhrs(true);
    } catch (error) {
      const detail = error?.response?.data?.error || error?.response?.data?.message;
      setMessage({ type: 'error', text: detail || error?.message || 'File upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const openFile = async (item) => {
    const url = item.name || item.url || item.fileUrl;
    if (!url) {
      Alert.alert('File unavailable', 'This document does not have a viewable link.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Cannot open file', 'No application is available to view this document.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPhrs(true)} tintColor={colors.primaryAccent} />}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>VET DOCS</Text>
          <Text style={styles.title}>Personal health records</Text>
          <Text style={styles.subtitle}>Keep your pet's medical documents secure and easy to find.</Text>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.cardHeader}>
            <View style={styles.uploadIcon}><Upload size={20} color={colors.buttonText} /></View>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.cardTitle}>Upload a new document</Text>
              <Text style={styles.cardSubtitle}>PDF, Word, Excel, or image files</Text>
            </View>
          </View>
          <Text style={styles.label}>Document title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Lab report, X-ray, prescription..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <Pressable style={styles.fileButton} onPress={chooseFile}>
            <FileText size={19} color={colors.primaryAccent} />
            <Text style={styles.fileButtonText}>{file?.name || 'Choose a file'}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          {file ? <Text style={styles.fileMeta}>{formatSize(file.size)}</Text> : null}
          <Pressable style={[styles.uploadButton, (uploading || !file || !title.trim()) && styles.disabled]} onPress={uploadFile} disabled={uploading || !file || !title.trim()}>
            {uploading ? <ActivityIndicator color={colors.buttonText} /> : <><Upload size={18} color={colors.buttonText} /><Text style={styles.uploadButtonText}>Upload file</Text></>}
          </Pressable>
          {message ? (
            <View style={[styles.message, message.type === 'success' ? styles.successMessage : message.type === 'warning' ? styles.warningMessage : styles.errorMessage]}>
              {message.type === 'success' ? <CheckCircle size={17} color="#257A49" /> : <XCircle size={17} color="#A13737" />}
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.listHeader}>
          <View><Text style={styles.sectionTitle}>Your uploaded files</Text><Text style={styles.count}>{phrList.length} {phrList.length === 1 ? 'file' : 'files'}</Text></View>
          <Pressable onPress={() => fetchPhrs(true)} accessibilityLabel="Refresh health records"><RefreshCw size={19} color={colors.primaryDark} /></Pressable>
        </View>

        {loading ? <View style={styles.state}><ActivityIndicator size="large" color={colors.primaryAccent} /><Text style={styles.stateText}>Loading your files...</Text></View> : phrList.length === 0 ? (
          <View style={styles.emptyState}><FileText size={40} color={colors.primaryAccent} /><Text style={styles.emptyTitle}>No files uploaded yet</Text><Text style={styles.stateText}>Upload your first PHR file to get started.</Text></View>
        ) : phrList.map((item, index) => (
          <View style={styles.fileCard} key={item._id || `${item.title}-${index}`}>
            <View style={styles.fileIcon}><FileText size={21} color={colors.primaryAccent} /></View>
            <View style={styles.fileCopy}><Text style={styles.fileTitle}>{item.title || 'Untitled document'}</Text><Text style={styles.fileDetails}>{formatDate(item.timeStamp || item.createdAt)}{item.size ? `  ·  ${formatSize(item.size)}` : ''}</Text></View>
            <Pressable style={styles.viewButton} onPress={() => openFile(item)}><Text style={styles.viewText}>View</Text></Pressable>
          </View>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} activeScreen="Phr" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  hero: { paddingVertical: 10, marginBottom: 18 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginTop: 7 },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 9 },
  uploadCard: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  uploadIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primaryAccent, alignItems: 'center', justifyContent: 'center' },
  cardHeaderCopy: { flex: 1, marginLeft: 12 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 12, color: colors.textPrimary, backgroundColor: '#FFF9FA', marginBottom: 12 },
  fileButton: { minHeight: 50, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primaryAccent, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  fileButtonText: { flex: 1, color: colors.textSecondary, marginLeft: 9 },
  fileMeta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  uploadButton: { minHeight: 50, borderRadius: 11, backgroundColor: colors.buttonBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  uploadButtonText: { color: colors.buttonText, fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.5 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 11, marginTop: 14 },
  successMessage: { backgroundColor: '#E6F5EC' },
  warningMessage: { backgroundColor: '#FFF2D8' },
  errorMessage: { backgroundColor: '#FCE9E9' },
  messageText: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  count: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 13, marginBottom: 10 },
  fileIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#FBEFF4', alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1, marginLeft: 11, paddingRight: 8 },
  fileTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  fileDetails: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  viewButton: { borderWidth: 1, borderColor: colors.primaryAccent, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 7 },
  viewText: { color: colors.primaryAccent, fontSize: 12, fontWeight: '800' },
  state: { alignItems: 'center', paddingVertical: 48 },
  stateText: { color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 12 },
});
