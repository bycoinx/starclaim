import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../constants/Theme';

const ITEMS = [
  { key: 'claim', label: 'Yıldız Al', icon: 'star', iconOutline: 'star-outline', href: '/(tabs)/claim' },
  { key: 'sky', label: 'Sky Live', icon: 'telescope', iconOutline: 'telescope-outline', href: '/(tabs)/sky' },
  { key: 'universe', label: '3D Evren', icon: 'cube', iconOutline: 'cube-outline', href: '/(tabs)/universe' },
  { key: 'vault', label: 'StarVault', icon: 'lock-closed', iconOutline: 'lock-closed-outline', href: '/(tabs)/vault/home' },
  { key: 'profile', label: 'Profil', icon: 'person-circle', iconOutline: 'person-circle-outline', href: '/(tabs)/profile' },
];

function getActiveKey(pathname) {
  if (pathname.includes('/claim') || pathname === '/stars') return 'claim';
  if (pathname.includes('/sky') || pathname.includes('/starmap')) return 'sky';
  if (pathname.includes('/universe') || pathname.includes('/starvoyage')) return 'universe';
  if (pathname.includes('/vault')) return 'vault';
  if (pathname.includes('/profile') || pathname.includes('/mystars') || pathname.includes('/stardetail')) return 'profile';
  return null;
}

export default function StarClaimTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveKey(pathname);

  return (
    <View style={[
      styles.safeFrame,
      { paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: Math.max(6, insets.bottom) },
    ]}>
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const active = activeKey === item.key;
          const accent = item.key === 'claim' ? THEME.colors.secondary : THEME.colors.primary;
          return (
            <TouchableOpacity
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              activeOpacity={0.72}
              style={styles.item}
              onPress={() => router.replace(item.href)}
            >
              <Ionicons
                name={active ? item.icon : item.iconOutline}
                size={22}
                color={active ? accent : 'rgba(244,247,255,0.52)'}
              />
              <Text style={[styles.label, active && { color: accent }]} numberOfLines={1}>
                {item.label}
              </Text>
              {active && <View style={[styles.indicator, { backgroundColor: accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeFrame: {
    backgroundColor: '#02040A',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(244,247,255,0.12)',
  },
  bar: {
    height: 58,
    flexDirection: 'row',
    backgroundColor: 'rgba(7,11,20,0.96)',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    color: 'rgba(244,247,255,0.52)',
    fontSize: 9,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
  },
});
