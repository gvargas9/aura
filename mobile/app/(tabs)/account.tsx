import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/types';
import { Colors } from '../../constants/Colors';

interface MenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
}

export default function AccountScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) setProfile(data as Profile);
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      subtitle: 'Name, email, preferences',
      onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available soon'),
    },
    {
      icon: 'heart-outline',
      label: 'Wishlist',
      subtitle: 'Your saved products',
      onPress: () => Alert.alert('Coming Soon', 'Wishlist will be available soon'),
    },
    {
      icon: 'card-outline',
      label: 'Payment Methods',
      subtitle: 'Manage cards and billing',
      onPress: () => Alert.alert('Coming Soon', 'Payment management will be available soon'),
    },
    {
      icon: 'location-outline',
      label: 'Addresses',
      subtitle: 'Shipping addresses',
      onPress: () => Alert.alert('Coming Soon', 'Address management will be available soon'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      subtitle: 'Push notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'FAQ, contact us',
      onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name
                ? profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.email}>{profile?.email || ''}</Text>
          {profile?.credits != null && profile.credits > 0 && (
            <View style={styles.creditsBadge}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.creditsText}>
                ${profile.credits.toFixed(2)} credits
              </Text>
            </View>
          )}
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.color || Colors.text}
              />
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemLabel, item.color ? { color: item.color } : undefined]}>
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Aura v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
  },
  creditsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentDark,
  },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 24,
  },
});
