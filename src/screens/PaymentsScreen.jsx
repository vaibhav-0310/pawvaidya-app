import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { ArrowLeft, Banknote, CreditCard, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import api from '../services/api_essentials';
import FeedbackBanner from '../components/FeedbackBanner';

const RAZORPAY_KEY_ID = 'rzp_test_SZsyevxtPByPrh';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  alternatePhone: '',
};

// FIX: strip currency symbols AND thousands separators (commas), and
// coerce to a real number. Previously "₹1,299.00" parsed as 1 because
// parseFloat stops at the first comma.
const parsePrice = (price) => {
  const value = typeof price === 'string' ? price.replace(/[₹$,]/g, '').trim() : price;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseQuantity = (quantity) => Math.max(1, Number.parseInt(quantity, 10) || 1);

export default function PaymentsScreen({ navigation }) {
  const [formData, setFormData] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const submitLock = useRef(false);
  const [feedback, setFeedback] = useState(null);
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + parsePrice(item.price) * parseQuantity(item.quantity),
    0
  );

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      // Handle both a bare array response and a { items: [...] } shape,
      // so cart items don't silently disappear if the API shape changes.
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setCartItems(items);
    } catch (error) {
      Alert.alert('Unable to load cart', 'Please try again before checking out.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    const requiredFields = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'zipCode'];
    requiredFields.forEach((field) => {
      if (!formData[field].trim()) nextErrors[field] = 'Required';
    });
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = 'Invalid email';
    if (formData.phone && formData.phone.replace(/\D/g, '').length !== 10) nextErrors.phone = 'Use 10 digits';
    if (formData.zipCode && formData.zipCode.replace(/\D/g, '').length !== 6) nextErrors.zipCode = 'Use 6 digits';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const finishOrder = async () => {
    await api.delete('/cart/deleteall');
    setCartItems([]);
    setFeedback({ type: 'success', message: 'Your order has been confirmed.' });
  };

  const payWithRazorpay = async () => {
    // FIX: round to 2 decimals before sending, and re-validate on this side
    // too, so a stale/zero total can't silently reach the backend.
    const safeAmount = Math.round(totalAmount * 100) / 100;
    if (!safeAmount || safeAmount <= 0) {
      throw new Error('Order amount must be greater than zero. Please refresh your cart.');
    }

    const { data: order } = await api.post('/paypal/create-order', {
      amount: safeAmount,
      description: `PawVaidya Order - ${formData.fullName}`,
      customerData: formData,
      cartItems,
    });
    const key = order?.key_id || RAZORPAY_KEY_ID;
    const orderId = order?.id;
    const orderAmount = Number(order?.amount);
    if (!orderId) throw new Error('Create-order response is missing the Razorpay order ID.');
    if (!Number.isInteger(orderAmount) || orderAmount <= 0) {
      throw new Error('Create-order response is missing a valid amount in paise.');
    }
    if (key.includes('replace_with')) {
      throw new Error('Configure the Razorpay public key in PaymentsScreen.jsx');
    }

    const payment = await RazorpayCheckout.open({
      key,
      amount: orderAmount,
      currency: order.currency || 'INR',
      name: 'PawVaidya',
      description: 'Pet essentials order',
      order_id: orderId,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone.replace(/\D/g, ''),
      },
      theme: { color: colors.primaryAccent },
    });

    if (!payment?.razorpay_payment_id || !payment?.razorpay_signature) {
      throw new Error('Razorpay returned an incomplete payment response.');
    }

    await api.post('/paypal/payment-success', {
      paymentId: payment.razorpay_payment_id,
      orderId: payment.razorpay_order_id || orderId,
      signature: payment.razorpay_signature,
      amount: safeAmount,
      customerData: formData,
      cartItems,
    });
  };

  const placeOrder = async () => {
    if (submitLock.current) return;

    if (!validate()) {
      setFeedback({ type: 'warning', message: 'Please complete the highlighted fields.' });
      return;
    }
    // FIX: guard against a zero/invalid total, not just an empty cart array.
    // This catches the case where items exist but their price/quantity
    // fields didn't parse (e.g. mismatched field names from the API).
    if (!cartItems.length || totalAmount <= 0) {
      setFeedback({ type: 'warning', message: 'Add an item before placing an order.' });
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      if (paymentMethod === 'razorpay') {
        await payWithRazorpay();
      } else {
        const orderId = `COD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await api.post(`/orders/${orderId}`, {
          customer: formData,
          items: cartItems,
          totalAmount,
          paymentMethod: 'cod',
          status: 'confirmed',
        });
      }
      await finishOrder();
    } catch (error) {
      // TEMP DEBUG: log everything so we can see exactly which layer threw
      // and what shape the error object has. Remove once diagnosed.
      console.log('--- PAYMENT ERROR DEBUG ---');
      console.log('error.code:', error?.code);
      console.log('error.description:', error?.description);
      console.log('error.message:', error?.message);
      console.log('error.response?.status:', error?.response?.status);
      console.log('error.response?.data:', JSON.stringify(error?.response?.data));
      console.log('full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.log('--- END DEBUG ---');

      if (error?.code !== 0 && error?.description !== 'Payment cancelled') {
        const backendMessage = error?.response?.data?.error || error?.response?.data?.message;
        setFeedback({ type: 'error', message: backendMessage || error?.description || error?.message || 'Please try again.' });
      }
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const renderInput = (name, label, placeholder, keyboardType = 'default') => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[name] && styles.inputError]}
        value={formData[name]}
        onChangeText={(value) => updateField(name, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={name === 'email' ? 'none' : 'words'}
      />
      {errors[name] && <Text style={styles.error}>{errors[name]}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.primaryAccent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
            <ArrowLeft size={22} color={colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Checkout</Text>
          <View style={styles.topSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete your purchase</Text>
        <Text style={styles.subtitle}>Where should we deliver your pet’s essentials?</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          {renderInput('fullName', 'Full name *', 'Enter your full name')}
          {renderInput('email', 'Email *', 'you@example.com', 'email-address')}
          <View style={styles.row}>
            <View style={styles.half}>{renderInput('phone', 'Phone *', '10-digit number', 'phone-pad')}</View>
            <View style={styles.half}>{renderInput('alternatePhone', 'Alternate phone', 'Optional', 'phone-pad')}</View>
          </View>
          {renderInput('street', 'Street address *', 'House number and street')}
          <View style={styles.row}>
            <View style={styles.half}>{renderInput('city', 'City *', 'City')}</View>
            <View style={styles.half}>{renderInput('state', 'State *', 'State')}</View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>{renderInput('zipCode', 'PIN code *', '6-digit PIN', 'number-pad')}</View>
            <View style={styles.half}>{renderInput('country', 'Country', 'India')}</View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'razorpay' && styles.selected]} onPress={() => setPaymentMethod('razorpay')}>
            <CreditCard size={22} color={colors.primaryAccent} />
            <View style={styles.paymentCopy}><Text style={styles.paymentName}>Razorpay</Text><Text style={styles.paymentDescription}>Cards, UPI, netbanking and wallets</Text></View>
            <View style={[styles.radio, paymentMethod === 'razorpay' && styles.radioSelected]} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'cod' && styles.selected]} onPress={() => setPaymentMethod('cod')}>
            <Banknote size={22} color={colors.primaryAccent} />
            <View style={styles.paymentCopy}><Text style={styles.paymentName}>Cash on delivery</Text><Text style={styles.paymentDescription}>Pay when your order arrives</Text></View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioSelected]} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          {cartItems.map((item, index) => (
            <View style={styles.itemRow} key={item._id || index}>
              <View style={styles.itemCopy}><Text style={styles.itemName}>{item.title}</Text><Text style={styles.itemQuantity}>Qty {parseQuantity(item.quantity)}</Text></View>
              <Text style={styles.itemPrice}>₹{(parsePrice(item.price) * parseQuantity(item.quantity)).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>₹{totalAmount.toFixed(2)}</Text></View>
        </View>

        <TouchableOpacity style={[styles.placeButton, (submitting || !cartItems.length) && styles.disabled]} onPress={placeOrder} disabled={submitting || !cartItems.length}>
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.placeButtonText}>{paymentMethod === 'cod' ? 'Place order' : 'Pay securely'}</Text>}
        </TouchableOpacity>
        <View style={styles.security}><ShieldCheck size={16} color={colors.primaryAccent} /><Text style={styles.securityText}>Secure checkout powered by Razorpay</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} actionLabel="View orders" onAction={() => navigation.navigate('Orders')} onDismiss={dismissFeedback} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  topSpacer: { width: 40 },
  content: { padding: 16, paddingBottom: 36 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: 6, marginBottom: 20, fontSize: 15 },
  section: { backgroundColor: colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  field: { marginBottom: 12 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, minHeight: 46, paddingHorizontal: 12, color: colors.textPrimary, backgroundColor: '#FFF9FA' },
  inputError: { borderColor: '#C0392B' },
  error: { color: '#C0392B', fontSize: 11, marginTop: 3 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, padding: 13, marginBottom: 10 },
  selected: { borderColor: colors.primaryAccent, backgroundColor: '#FBEFF4' },
  paymentCopy: { flex: 1, marginLeft: 11 },
  paymentName: { fontWeight: '700', color: colors.textPrimary, fontSize: 15 },
  paymentDescription: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.textMuted },
  radioSelected: { borderColor: colors.primaryAccent, backgroundColor: colors.primaryAccent },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemCopy: { flex: 1, paddingRight: 10 },
  itemName: { color: colors.textPrimary, fontWeight: '600' },
  itemQuantity: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  itemPrice: { color: colors.textPrimary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  totalLabel: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  total: { color: colors.primaryAccent, fontSize: 20, fontWeight: '800' },
  placeButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.buttonBg, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  placeButtonText: { color: colors.buttonText, fontSize: 16, fontWeight: '800' },
  security: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 6 },
  securityText: { color: colors.textSecondary, fontSize: 12 },
});