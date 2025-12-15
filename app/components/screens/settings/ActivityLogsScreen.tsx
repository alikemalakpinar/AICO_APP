import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../../constants/Api';

interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_name_display: string;
  action: string;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  old_value: string | null;
  new_value: string | null;
  details: string;
  branch_id: number;
  created_at: string;
}

interface ActivityLogsScreenProps {
  onBack: () => void;
  currentUser: any;
}

const ACTION_ICONS: { [key: string]: string } = {
  create: 'add-circle',
  update: 'create',
  delete: 'trash',
  login: 'log-in',
  logout: 'log-out',
  register: 'person-add',
  update_status: 'sync',
  update_role: 'shield',
  update_permissions: 'key',
  update_branch: 'business',
  update_stock: 'cube',
  upload_document: 'document',
  delete_document: 'document-outline',
  cancel: 'close-circle',
};

const ACTION_COLORS: { [key: string]: string } = {
  create: '#10B981',
  update: '#3B82F6',
  delete: '#EF4444',
  login: '#8B5CF6',
  logout: '#6B7280',
  register: '#10B981',
  update_status: '#F59E0B',
  update_role: '#EC4899',
  update_permissions: '#14B8A6',
  update_branch: '#6366F1',
  update_stock: '#F97316',
  upload_document: '#0EA5E9',
  delete_document: '#EF4444',
  cancel: '#EF4444',
};

const ENTITY_LABELS: { [key: string]: string } = {
  order: 'Sipariş',
  customer: 'Müşteri',
  product: 'Ürün',
  user: 'Kullanıcı',
  branch: 'Şube',
  payment: 'Ödeme',
  exchange_rate: 'Döviz Kuru',
};

const ACTION_LABELS: { [key: string]: string } = {
  create: 'Oluşturuldu',
  update: 'Güncellendi',
  delete: 'Silindi',
  login: 'Giriş Yaptı',
  logout: 'Çıkış Yaptı',
  register: 'Kayıt Oldu',
  update_status: 'Durum Güncellendi',
  update_role: 'Rol Değiştirildi',
  update_permissions: 'Yetkiler Değiştirildi',
  update_branch: 'Şube Değiştirildi',
  update_stock: 'Stok Güncellendi',
  upload_document: 'Belge Yüklendi',
  delete_document: 'Belge Silindi',
  cancel: 'İptal Edildi',
};

export default function ActivityLogsScreen({ onBack, currentUser }: ActivityLogsScreenProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      let url = `${API_URL}/api/activity-logs/recent?limit=100`;
      if (filter !== 'all') {
        url = `${API_URL}/api/activity-logs?entity_type=${filter}&limit=100`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('İşlem kayıtları hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || 'ellipse';
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || '#6B7280';
  };

  const getEntityLabel = (entityType: string) => {
    return ENTITY_LABELS[entityType] || entityType;
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };

  const filters = [
    { id: 'all', label: 'Tümü' },
    { id: 'order', label: 'Siparişler' },
    { id: 'customer', label: 'Müşteriler' },
    { id: 'product', label: 'Ürünler' },
    { id: 'user', label: 'Kullanıcılar' },
    { id: 'payment', label: 'Ödemeler' },
  ];

  const renderLogItem = (log: ActivityLog) => {
    const actionColor = getActionColor(log.action);

    return (
      <View key={log.id} style={styles.logItem}>
        <View style={[styles.logIcon, { backgroundColor: `${actionColor}20` }]}>
          <Ionicons name={getActionIcon(log.action) as any} size={20} color={actionColor} />
        </View>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logUser}>{log.user_name_display || log.user_name || 'Sistem'}</Text>
            <Text style={styles.logTime}>{formatDate(log.created_at)}</Text>
          </View>
          <View style={styles.logDetails}>
            <View style={[styles.actionBadge, { backgroundColor: `${actionColor}20` }]}>
              <Text style={[styles.actionText, { color: actionColor }]}>
                {getActionLabel(log.action)}
              </Text>
            </View>
            {log.entity_type && (
              <View style={styles.entityBadge}>
                <Text style={styles.entityText}>{getEntityLabel(log.entity_type)}</Text>
              </View>
            )}
          </View>
          {log.entity_name && (
            <Text style={styles.logEntityName}>{log.entity_name}</Text>
          )}
          {log.details && (
            <Text style={styles.logDescription}>{log.details}</Text>
          )}
        </View>
      </View>
    );
  };

  const groupLogsByDate = (logs: ActivityLog[]) => {
    const groups: { [key: string]: ActivityLog[] } = {};

    logs.forEach((log) => {
      const date = new Date(log.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Bugün';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Dün';
      } else {
        key = date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(log);
    });

    return groups;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const groupedLogs = groupLogsByDate(logs);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İşlem Kayıtları</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterButton, filter === f.id && styles.filterButtonActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Logs */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#4B5563" />
            <Text style={styles.emptyText}>Henüz işlem kaydı yok</Text>
          </View>
        ) : (
          Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateLogs.map(renderLogItem)}
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  logItem: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  entityText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  logEntityName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  logDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
