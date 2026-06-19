import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/Theme';

export default function MobileHeader({
  title,
  eyebrow = 'STARCLAIM',
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightLabel,
}) {
  return (
    <View style={styles.header}>
      {leftIcon ? (
        <HeaderAction icon={leftIcon} label="Geri" onPress={onLeftPress} />
      ) : (
        <View style={styles.brandMark}>
          <Ionicons name="star" size={18} color={THEME.colors.secondary} />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {rightIcon ? (
        <HeaderAction icon={rightIcon} label={rightLabel || 'Eylem'} onPress={onRightPress} />
      ) : (
        <View style={styles.actionPlaceholder} />
      )}
    </View>
  );
}

function HeaderAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.action}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={THEME.colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    height: THEME.components.headerHeight,
    paddingHorizontal: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244,247,255,0.1)',
  },
  brandMark: {
    width: THEME.components.iconButton,
    height: THEME.components.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, marginHorizontal: 8 },
  eyebrow: { color: THEME.colors.secondary, fontSize: 8, fontWeight: '700' },
  title: { color: THEME.colors.text, fontSize: 22, fontFamily: 'Cinzel_700Bold', marginTop: 1 },
  action: {
    width: THEME.components.iconButton,
    height: THEME.components.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(119,191,255,0.24)',
    backgroundColor: THEME.colors.panel,
  },
  actionPlaceholder: { width: THEME.components.iconButton, height: THEME.components.iconButton },
});
