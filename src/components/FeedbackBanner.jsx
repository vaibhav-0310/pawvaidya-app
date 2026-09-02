import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Info, XCircle } from 'lucide-react-native';
import colors from '../theme/colors';

export default function FeedbackBanner({ type = 'success', message, actionLabel, onAction, onDismiss }) {
  useEffect(() => {
    const dismiss = typeof onDismiss === 'function' ? onDismiss : () => {};
    const timeout = setTimeout(dismiss, 4500);
    return () => clearTimeout(timeout);
  }, [message, onDismiss]);

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';
  const Icon = isSuccess ? CheckCircle : isWarning ? Info : XCircle;
  const iconColor = isSuccess ? '#257A49' : isWarning ? '#A66A12' : '#A13737';

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Icon size={21} color={iconColor} />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && typeof onAction === 'function' ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', left: 16, right: 16, bottom: 76, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, padding: 13, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  message: { flex: 1, color: colors.textPrimary, fontSize: 13, marginHorizontal: 9 },
  action: { borderLeftWidth: 1, borderLeftColor: colors.cardBorder, paddingLeft: 10 },
  actionText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});
