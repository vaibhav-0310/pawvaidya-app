// src/screens/LoginScreen.jsx
// Mirrors web app's Login.jsx: username+password -> send OTP -> submit with
// OTP -> login. Uses SafeAreaView + KeyboardAvoidingView so the form never
// sits under the notch/status bar or gets hidden behind the keyboard.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import colors from '../theme/colors';
import api, { BASE_URL } from '../services/api_essentials';
import { useAuth } from '../context/AuthContext';
import FeedbackBanner from '../components/FeedbackBanner';

export default function LoginScreen({ navigation }) {
  const [form, setForm] = useState({ username: '', password: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { login } = useAuth();
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const handleInput = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGoogleLogin = () => {
    // Opens the web OAuth flow in the system browser. For a fully native
    // experience you'd typically swap this for a deep-link redirect back
    // into the app (e.g. pawvaidya://auth-callback) handled on the backend.
    Linking.openURL(`${BASE_URL}/auth/google`);
  };

  const handleSendOtp = async () => {
    if (!form.username || !form.password) {
      setFeedback({ type: 'warning', message: 'Please fill in your username and password.' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/send-otp', { username: form.username });
      setOtpSent(true);
      setFeedback({ type: 'success', message: 'OTP sent. Check your registered email or phone.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.response?.data?.error || 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/login', form);
      const responseUser = response.data?.user
        || response.data?.userData
        || (response.data?._id ? response.data : null)
        || (response.data?.userId ? {
          _id: response.data.userId,
          username: form.username,
        } : null);

      await login({
        user: responseUser,
        userType: response.data?.userType,
      });

      navigation?.navigate?.('Home');
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForm = () => (otpSent ? handleSubmit() : handleSendOtp());

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Logo size="large" />
          </View>

          <View style={styles.headingWrap}>
            <Text style={styles.heading}>Welcome</Text>
            <Text style={styles.heading}>To</Text>
            <Text style={styles.headingBrand}>PawVaidya.com !</Text>
            <Text style={styles.subheading}>
              Access expert advice for your furry friends
            </Text>
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.hr} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.hr} />
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={form.username}
              onChangeText={(v) => handleInput('username', v)}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={form.password}
                onChangeText={(v) => handleInput('password', v)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {otpSent && (
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={form.otp}
                onChangeText={(v) => handleInput('otp', v)}
              />
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={onSubmitForm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {otpSent ? 'Submit' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New Here? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Signup')}>
              <Text style={styles.signupLink}>SignUp Here</Text>
            </TouchableOpacity>
            <Text style={styles.signupText}> to connect with trusted vets</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} onDismiss={dismissFeedback} /> : null}
      <BottomNav navigation={navigation} activeScreen="Login" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headingWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headingBrand: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryAccent,
    marginTop: 4,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  orText: {
    marginHorizontal: 12,
    color: colors.textMuted,
    fontSize: 13,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 30,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: 10,
  },
  submitButton: {
    backgroundColor: colors.buttonBg,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    color: colors.primaryAccent,
    fontWeight: '600',
  },
});