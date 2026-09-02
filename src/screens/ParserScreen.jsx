import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { CheckCircle, FileQuestion, FileText, Send, Upload, XCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import api from '../services/api_essentials';

const formatSize = (bytes) => {
  if (!bytes) return 'Size unavailable';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function AnswerText({ answer }) {
  const parts = answer.split(/(\*\*[^*]+\*\*)/g);

  return (
    <Text style={styles.answerText}>
      {parts.map((part, index) => {
        const isBold = part.startsWith('**') && part.endsWith('**');
        const content = isBold ? part.slice(2, -2) : part;
        return (
          <Text key={`${part}-${index}`} style={isBold ? styles.answerBold : undefined}>
            {content}
          </Text>
        );
      })}
    </Text>
  );
}

export default function ParserScreen({ navigation }) {
  const [pdf, setPdf] = useState(null);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [message, setMessage] = useState(null);
  const scrollViewRef = useRef(null);

  const choosePdf = async () => {
    try {
      const [selected] = await pick({ type: [types.pdf], allowMultiSelection: false });
      setPdf(selected);
      setUploadSuccess(false);
      setAnswer('');
      setMessage(null);
    } catch (error) {
      if (!isErrorWithCode(error) || error.code !== errorCodes.OPERATION_CANCELED) {
        setMessage({ type: 'error', text: 'Unable to select the PDF.' });
      }
    }
  };

  const uploadPdf = async () => {
    if (!pdf) {
      setMessage({ type: 'warning', text: 'Choose a PDF file before uploading.' });
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setMessage(null);
    const formData = new FormData();
    formData.append('pdf', {
      uri: pdf.uri,
      type: pdf.type || 'application/pdf',
      name: pdf.name || 'document.pdf',
    });

    try {
      await api.post('/pdf-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setUploadSuccess(true);
      setMessage({ type: 'success', text: 'PDF uploaded successfully. You can ask questions now.' });
    } catch (error) {
      const detail = error?.response?.data?.error || 'PDF upload failed. Please try again.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async () => {
    if (!query.trim()) {
      setMessage({ type: 'warning', text: 'Enter a question first.' });
      return;
    }
    if (!uploadSuccess) {
      setMessage({ type: 'warning', text: 'Upload a PDF before asking questions.' });
      return;
    }

    setAsking(true);
    setAnswer('');
    setMessage(null);
    try {
      const { data } = await api.post('/ask', { query: query.trim() }, { timeout: 45000 });
      setAnswer(data?.answer || 'No answer was returned for that question.');
    } catch (error) {
      const detail = error?.response?.data?.error || 'Could not get an answer. Please try again.';
      setAnswer(detail);
      setMessage({ type: 'error', text: detail });
    } finally {
      setAsking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>AI DOCUMENT ANALYSIS</Text>
          <Text style={styles.title}>Chat with PawVaidya</Text>
          <Text style={styles.subtitle}>Upload a medical document and get helpful answers about its contents.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.iconBox}><Upload size={19} color={colors.buttonText} /></View>
            <View style={styles.headingCopy}><Text style={styles.cardTitle}>Upload PDF document</Text><Text style={styles.cardSubtitle}>Choose a medical PDF to analyze</Text></View>
          </View>
          <Pressable style={styles.filePicker} onPress={choosePdf}>
            <FileText size={20} color={colors.primaryAccent} />
            <Text style={styles.fileName}>{pdf?.name || 'Choose PDF file'}</Text>
          </Pressable>
          {pdf ? <Text style={styles.fileMeta}>{formatSize(pdf.size)}</Text> : null}
          <Pressable style={[styles.primaryButton, (uploading || !pdf) && styles.disabled]} onPress={uploadPdf} disabled={uploading || !pdf}>
            {uploading ? <ActivityIndicator color={colors.buttonText} /> : <><Upload size={18} color={colors.buttonText} /><Text style={styles.primaryButtonText}>Upload PDF</Text></>}
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.iconBox}><FileQuestion size={19} color={colors.buttonText} /></View>
            <View style={styles.headingCopy}><Text style={styles.cardTitle}>Ask questions</Text><Text style={styles.cardSubtitle}>Ask anything about your uploaded document</Text></View>
          </View>
          {!uploadSuccess ? <View style={styles.notice}><Text style={styles.noticeText}>Upload a PDF document first before asking questions.</Text></View> : null}
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ask a question about your PDF..."
            placeholderTextColor={colors.textMuted}
            style={styles.questionInput}
            returnKeyType="send"
            onSubmitEditing={askQuestion}
            editable={!asking}
            onFocus={() => {
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 250);
            }}
          />
          <Pressable style={[styles.askButton, (!query.trim() || !uploadSuccess || asking) && styles.disabled]} onPress={askQuestion} disabled={!query.trim() || !uploadSuccess || asking}>
            {asking ? <ActivityIndicator color={colors.buttonText} /> : <><Send size={18} color={colors.buttonText} /><Text style={styles.primaryButtonText}>Ask question</Text></>}
          </Pressable>
          {asking ? <View style={styles.progress}><ActivityIndicator color={colors.primaryAccent} /><Text style={styles.progressText}>Processing your question...</Text></View> : null}
          {answer && !asking ? <View style={styles.answer}><CheckCircle size={19} color={colors.primaryAccent} /><View style={styles.answerCopy}><Text style={styles.answerTitle}>AI answer</Text><AnswerText answer={answer} /></View></View> : null}
        </View>

        {message ? <View style={[styles.message, message.type === 'success' ? styles.success : message.type === 'warning' ? styles.warning : styles.failure]}>{message.type === 'success' ? <CheckCircle size={18} color="#257A49" /> : <XCircle size={18} color="#A13737" />}<Text style={styles.messageText}>{message.text}</Text></View> : null}
      </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav navigation={navigation} activeScreen="Parser" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  hero: { marginBottom: 18 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginTop: 7 },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 9 },
  card: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, padding: 16, marginBottom: 14 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryAccent, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, marginLeft: 11 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  filePicker: { minHeight: 50, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primaryAccent, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  fileName: { flex: 1, color: colors.textSecondary, marginLeft: 9 },
  fileMeta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  primaryButton: { minHeight: 50, borderRadius: 11, backgroundColor: colors.buttonBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  askButton: { minHeight: 50, borderRadius: 11, backgroundColor: colors.primaryAccent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  primaryButtonText: { color: colors.buttonText, fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.5 },
  notice: { backgroundColor: '#FFF2D8', borderRadius: 10, padding: 11, marginBottom: 13 },
  noticeText: { color: '#8A5A12', fontSize: 12, lineHeight: 17 },
  questionInput: { minHeight: 50, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 12, color: colors.textPrimary, backgroundColor: '#FFF9FA' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  progressText: { color: colors.textSecondary, fontSize: 13 },
  answer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F1F8F4', borderRadius: 12, padding: 13, marginTop: 16 },
  answerCopy: { flex: 1, marginLeft: 9 },
  answerTitle: { color: '#257A49', fontWeight: '800', marginBottom: 5 },
  answerText: { color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
  answerBold: { fontWeight: '800' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 11, marginBottom: 14 },
  messageText: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  success: { backgroundColor: '#E6F5EC' },
  warning: { backgroundColor: '#FFF2D8' },
  failure: { backgroundColor: '#FCE9E9' },
});
