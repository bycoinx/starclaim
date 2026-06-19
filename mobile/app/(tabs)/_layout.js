import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const IMMERSIVE_ROUTES = [
  '/explore/starmap',
  '/explore/starvoyage',
  '/explore/stardetail',
];

export default function TabsLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const immersive = IMMERSIVE_ROUTES.some((route) => pathname.endsWith(route));

  return (
    <Tabs
      initialRouteName="explore"
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#000' },
        tabBarHideOnKeyboard: true,
        tabBarStyle: immersive
          ? { display: 'none' }
          : {
              backgroundColor: 'rgba(5, 7, 13, 0.9)', // Glassy Dark
              borderTopColor: 'rgba(0, 242, 254, 0.2)', // Cyan border
              borderTopWidth: 1.5,
              height: 70,
              paddingBottom: Math.max(8, insets.bottom),
              paddingTop: 8,
              position: 'absolute',
              bottom: 0,
              left: insets.left,
              right: insets.right,
              elevation: 0,
            },
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'KEŞFET',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'planet' : 'planet-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mystars"
        options={{
          title: 'YILDIZLARIM',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'star' : 'star-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'KASA',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'lock-closed' : 'lock-open-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
