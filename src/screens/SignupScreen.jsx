import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import FeedbackBanner from '../components/FeedbackBanner';
import colors from '../theme/colors';
import api from '../services/api_essentials';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  username: '',
  email: '',
  password: '',
  state: '',
  district: '',
  otp: '',
};

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { login } = useAuth();
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const validateForm = () => {
    if (!form.username || !form.email || !form.password || !form.state || !form.district) {
      setFeedback({ type: 'warning', message: 'Please complete all fields.' });
      return false;
    }
    if (form.password.length < 6) {
      setFeedback({ type: 'warning', message: 'Password must be at least 6 characters long.' });
      return false;
    }
    if (!acceptedTerms) {
      setFeedback({ type: 'warning', message: 'Please accept the terms and conditions.' });
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await api.post('/send-otp', { email: form.email });
      setOtpSent(true);
      setFeedback({ type: 'success', message: 'OTP sent. Check your email.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to send OTP.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.otp) {
      setFeedback({ type: 'warning', message: 'Please enter the OTP.' });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/signup', form);
      const responseUser = response.data?.user
        || response.data?.userData
        || (response.data?._id ? response.data : null)
        || { username: form.username, email: form.email };
      await login({ user: responseUser, userType: response.data?.userType });
      navigation?.reset?.({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.error || error.response?.data?.message || 'Signup failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Logo size="large" />
          </View>
          <View style={styles.headingWrap}>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.subheading}>Access expert advice for your furry friends</Text>
          </View>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Username" placeholderTextColor={colors.textMuted} autoCapitalize="none" value={form.username} onChangeText={(value) => updateField('username', value)} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(value) => updateField('email', value)} />
            <View style={styles.passwordWrapper}>
              <TextInput style={styles.passwordInput} placeholder="Password" placeholderTextColor={colors.textMuted} secureTextEntry={!showPassword} autoCapitalize="none" value={form.password} onChangeText={(value) => updateField('password', value)} />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((previous) => !previous)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="State" placeholderTextColor={colors.textMuted} value={form.state} onChangeText={(value) => updateField('state', value)} />
            <TextInput style={styles.input} placeholder="District" placeholderTextColor={colors.textMuted} value={form.district} onChangeText={(value) => updateField('district', value)} />
            {otpSent ? <TextInput style={styles.input} placeholder="Enter OTP" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={form.otp} onChangeText={(value) => updateField('otp', value)} /> : null}

            <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms((previous) => !previous)} accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>{acceptedTerms ? <Text style={styles.checkmark}>✓</Text> : null}</View>
              <Text style={styles.termsText}>I accept the terms and conditions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={otpSent ? handleSubmit : handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.submitButtonText}>{otpSent ? 'Create account' : 'Send OTP'}</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Login')}><Text style={styles.loginLink}>Log in</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} onDismiss={dismissFeedback} /> : null}
      <BottomNav navigation={navigation} activeScreen="Login" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  headingWrap: { alignItems: 'center', marginBottom: 24 },
  heading: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subheading: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  form: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.cardBg, marginBottom: 16 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 30, backgroundColor: colors.cardBg, marginBottom: 16, paddingRight: 8 },
  passwordInput: { flex: 1, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16, color: colors.textPrimary },
  eyeButton: { padding: 10 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.primaryAccent, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: colors.primaryAccent },
  checkmark: { color: colors.buttonText, fontSize: 16, fontWeight: '800' },
  termsText: { color: colors.textSecondary, fontSize: 14, flex: 1 },
  submitButton: { backgroundColor: colors.buttonBg, borderRadius: 30, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  submitButtonText: { color: colors.buttonText, fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  loginText: { color: colors.textSecondary, fontSize: 14 },
  loginLink: { color: colors.primaryAccent, fontSize: 14, fontWeight: '700' },
});
