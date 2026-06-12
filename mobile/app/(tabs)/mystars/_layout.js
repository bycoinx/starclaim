import React from 'react';
import { Stack } from 'expo-router';

export default function MyStarsLayout() {
  return (
    <Stack
      initialRouteName="collection"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="collection" options={{ animation: 'fade' }} />
      <Stack.Screen name="starprofile" />
    </Stack>
  );
}
