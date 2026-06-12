import React from 'react';
import { Stack } from 'expo-router';

export default function VaultLayout() {
  return (
    <Stack
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="home" options={{ animation: 'fade' }} />
      <Stack.Screen name="newmessage" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="purchases" />
      <Stack.Screen name="locksetting" />
    </Stack>
  );
}
