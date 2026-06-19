import React from 'react';
import { Tabs } from 'expo-router';
import StarClaimTabBar from '../../components/StarClaimTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="claim"
      backBehavior="history"
      tabBar={() => <StarClaimTabBar />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#000' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="claim" options={{ title: 'Yıldız Al' }} />
      <Tabs.Screen name="sky" options={{ title: 'Sky Live' }} />
      <Tabs.Screen name="universe" options={{ title: '3D Evren' }} />
      <Tabs.Screen name="vault" options={{ title: 'StarVault' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="mystars" options={{ href: null }} />
    </Tabs>
  );
}
