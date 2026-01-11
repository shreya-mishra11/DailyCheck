import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const PROFILE_KEY = '@profile_data';
const TASKS_KEY = '@tasks_data';

type Profile = {
  name: string;
  email: string;
  avatar: string;
};

const defaultProfile: Profile = {
  name: 'Your Name',
  email: 'email@example.com',
  avatar: '',
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(TASKS_KEY);
      if (stored) {
        const tasks = JSON.parse(stored);
        const completed = tasks.filter((t: { completed: boolean }) => t.completed).length;
        setStats({
          total: tasks.length,
          completed,
          pending: tasks.length - completed,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const saveProfile = async () => {
    const updated = {
      ...profile,
      name: editName.trim() || profile.name,
      email: editEmail.trim() || profile.email,
    };
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const startEditing = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setIsEditing(true);
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your tasks and profile data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([PROFILE_KEY, TASKS_KEY]);
              setProfile(defaultProfile);
              setStats({ total: 0, completed: 0, pending: 0 });
              Alert.alert('Done', 'All data has been cleared.');
            } catch (error) {
              console.error('Failed to clear data:', error);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
            </View>
          )}
          <Pressable style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </Pressable>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <TextInput
              style={styles.editInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Your email"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.editButtons}>
              <Pressable
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.editButton, styles.saveButton]}
                onPress={saveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Pressable style={styles.editProfileButton} onPress={startEditing}>
              <Ionicons name="pencil" size={14} color="#6366f1" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="list" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, styles.statCardInfo]}>
            <Ionicons name="trending-up" size={24} color="#fff" />
            <Text style={styles.statNumber}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Notifications</Text>
              <Text style={styles.menuSubtext}>Manage your alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="color-palette-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Appearance</Text>
              <Text style={styles.menuSubtext}>Theme and display</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#fefce8' }]}>
              <Ionicons name="cloud-outline" size={20} color="#eab308" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Backup & Sync</Text>
              <Text style={styles.menuSubtext}>Cloud storage options</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>

        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={clearAllData}>
            <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Clear All Data</Text>
              <Text style={styles.menuSubtext}>Delete tasks and profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fca5a5" />
          </Pressable>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>TaskFlow</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  editForm: {
    width: '100%',
    gap: 12,
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: -24,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardPrimary: {
    backgroundColor: '#6366f1',
  },
  statCardSuccess: {
    backgroundColor: '#22c55e',
  },
  statCardWarning: {
    backgroundColor: '#f59e0b',
  },
  statCardInfo: {
    backgroundColor: '#3b82f6',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 72,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 120,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  appVersion: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});

