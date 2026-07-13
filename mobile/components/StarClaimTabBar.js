import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../constants/Theme';
import { TAB_ITEMS, getActiveTabKey } from '../src/platform/navigation/routes';

export default function StarClaimTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveTabKey(pathname);

  return (
    <View style={[
      styles.safeFrame,
      { paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: Math.max(6, insets.bottom) },
    ]}>
      <View style={styles.bar}>
        {TAB_ITEMS.map((item) => {
          const active = activeKey === item.key;
          const accent = item.key === 'claim' ? THEME.colors.secondary : THEME.colors.primary;
          return (
            <TouchableOpacity
              key={item.key}
              testID={`tab-${item.key}`}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              activeOpacity={0.72}
              style={styles.item}
              onPress={() => router.push(item.href)}
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
