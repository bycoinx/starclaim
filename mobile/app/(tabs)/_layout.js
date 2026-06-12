import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/Theme';

const IMMERSIVE_ROUTES = [
  '/explore/starmap',
  '/explore/starvoyage',
  '/explore/stardetail',
];

export default function TabsLayout() {
  const pathname = usePathname();
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
              backgroundColor: '#05070d',
              borderTopColor: 'rgba(255,255,255,0.08)',
              borderTopWidth: 1,
              height: 66,
              paddingBottom: 8,
              paddingTop: 7,
            },
        tabBarActiveTintColor: THEME.colors.secondary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.42)',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Kesfet',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mystars"
        options={{
          title: 'Yildizlarim',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'star' : 'star-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'shield' : 'shield-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
