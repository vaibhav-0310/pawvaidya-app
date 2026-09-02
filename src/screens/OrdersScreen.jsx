import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Package, RefreshCw, Truck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import api from '../services/api_essentials';

const filters = ['all', 'processing', 'in-transit', 'delivered'];

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const deliveryDateFor = (createdAt, days) => {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  date.setDate(date.getDate() + days);
  return date;
};

const getDeliveryStatus = (createdAt) => {
  const deliveryDate = deliveryDateFor(createdAt, 5);
  if (!deliveryDate) return 'processing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);
  if (today > deliveryDate) return 'delivered';
  if (today > new Date(createdAt)) return 'in-transit';
  return 'processing';
};

const statusLabel = (status) => status === 'in-transit'
  ? 'In Transit'
  : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

const statusColor = (status) => ({
  delivered: '#2D8A55',
  'in-transit': '#2F6FED',
  processing: colors.primaryAccent,
}[status] || colors.textSecondary);

function Timeline({ order, status }) {
  const transitComplete = status === 'in-transit' || status === 'delivered';
  return (
    <View style={styles.timeline}>
      <TimelineStep icon={Package} label="Order placed" date={order.createdAt} complete />
      <View style={[styles.connector, transitComplete && styles.connectorComplete]} />
      <TimelineStep icon={Truck} label="In transit" date={deliveryDateFor(order.createdAt, 2)} complete={transitComplete} />
      <View style={[styles.connector, status === 'delivered' && styles.connectorComplete]} />
      <TimelineStep icon={CheckCircle} label="Delivered" date={deliveryDateFor(order.createdAt, 5)} complete={status === 'delivered'} />
    </View>
  );
}

function TimelineStep({ icon: Icon, label, date, complete }) {
  return (
    <View style={styles.timelineStep}>
      <View style={[styles.timelineIcon, complete && styles.timelineIconComplete]}>
        <Icon size={16} color={complete ? colors.buttonText : colors.textMuted} />
      </View>
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineDate}>{formatDate(date)}</Text>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(Array.isArray(data) ? data : data?.orders || []);
      setError('');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to load your orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const visibleOrders = orders.filter((order) => (
    filter === 'all' || getDeliveryStatus(order.createdAt) === filter
  ));

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Header navigation={navigation} />
        <View style={styles.centerState}><ActivityIndicator size="large" color={colors.primaryAccent} /><Text style={styles.stateText}>Loading your orders...</Text></View>
        <BottomNav navigation={navigation} activeScreen="Account" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Header navigation={navigation} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={colors.primaryAccent} />}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.kicker}>PAWVAIDYA</Text>
            <Text style={styles.title}>My orders</Text>
            <Text style={styles.subtitle}>Track your pet essentials from checkout to doorstep.</Text>
          </View>
          <Pressable style={styles.refreshButton} onPress={() => fetchOrders(true)} accessibilityLabel="Refresh orders">
            <RefreshCw size={19} color={colors.primaryDark} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={19} color="#B33A3A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => fetchOrders()}><Text style={styles.retry}>Retry</Text></Pressable>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterButton, filter === item && styles.filterButtonActive]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{statusLabel(item)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.count}>Showing {visibleOrders.length} of {orders.length} orders</Text>

        {visibleOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={42} color={colors.primaryAccent} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Your PawVaidya purchases will appear here.</Text>
            <Pressable style={styles.shopButton} onPress={() => navigation.navigate('Marketplace')}><Text style={styles.shopButtonText}>Shop essentials</Text></Pressable>
          </View>
        ) : visibleOrders.map((order, index) => {
          const status = getDeliveryStatus(order.createdAt);
          const isExpanded = expandedOrder === (order._id || order.orderId || index);
          const orderKey = order._id || order.orderId || index;
          const items = Array.isArray(order.items) ? order.items : [];
          return (
            <View key={orderKey} style={styles.orderCard}>
              <Pressable style={styles.orderHeader} onPress={() => setExpandedOrder(isExpanded ? null : orderKey)}>
                <View style={styles.orderHeaderCopy}>
                  <Text style={styles.orderId}>Order #{order.orderId || 'N/A'}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={styles.orderHeaderRight}>
                  <Text style={styles.orderAmount}>₹{Number(order.amount || 0).toFixed(2)}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(status)}18` }]}><Text style={[styles.badgeText, { color: statusColor(status) }]}>{statusLabel(status)}</Text></View>
                </View>
                {isExpanded ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
              </Pressable>
              <Timeline order={order} status={status} />
              {isExpanded && (
                <View style={styles.details}>
                  <Text style={styles.detailHeading}>Delivery address</Text>
                  <Text style={styles.detailText}>{order.address || 'Address not available'}</Text>
                  <Text style={styles.detailText}>PIN: {order.pincode || 'N/A'}</Text>
                  <Text style={styles.detailHeading}>Items ({items.length})</Text>
                  {items.map((item, itemIndex) => (
                    <View style={styles.itemRow} key={`${orderKey}-${itemIndex}`}>
                      <Text style={styles.itemName}>{item.title || item.name || 'Item'}</Text>
                      <Text style={styles.itemMeta}>Qty {item.quantity || 1}  ₹{Number(item.price || 0).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <BottomNav navigation={navigation} activeScreen="Account" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { color: colors.textSecondary, marginTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleCopy: { flex: 1, paddingRight: 12 },
  kicker: { color: colors.accentPink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  refreshButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FCE9E9', borderRadius: 12, padding: 12, marginTop: 18 },
  errorText: { color: '#8E2D2D', flex: 1, fontSize: 13 },
  retry: { color: '#8E2D2D', fontWeight: '800' },
  filters: { gap: 8, paddingVertical: 20 },
  filterButton: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.cardBg },
  filterButtonActive: { backgroundColor: colors.buttonBg, borderColor: colors.buttonBg },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: colors.buttonText },
  count: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 },
  orderCard: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, marginBottom: 14, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15 },
  orderHeaderCopy: { flex: 1 },
  orderId: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  orderDate: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  orderHeaderRight: { alignItems: 'flex-end', gap: 5 },
  orderAmount: { color: colors.primaryAccent, fontSize: 16, fontWeight: '800' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 15, paddingBottom: 15 },
  timelineStep: { alignItems: 'center', width: 72 },
  timelineIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  timelineIconComplete: { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
  timelineLabel: { color: colors.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 5 },
  timelineDate: { color: colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  connector: { flex: 1, height: 1, backgroundColor: colors.cardBorder, marginTop: 14 },
  connectorComplete: { backgroundColor: colors.primaryAccent },
  details: { borderTopWidth: 1, borderTopColor: colors.cardBorder, padding: 15 },
  detailHeading: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 4, marginBottom: 6 },
  detailText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  itemName: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  itemMeta: { color: colors.textSecondary, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 70 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 14 },
  emptyText: { color: colors.textSecondary, marginTop: 7, textAlign: 'center' },
  shopButton: { backgroundColor: colors.buttonBg, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  shopButtonText: { color: colors.buttonText, fontWeight: '800' },
});
