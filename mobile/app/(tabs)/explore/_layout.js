import React from 'react';
import { Stack } from 'expo-router';

export default function ExploreLayout() {
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
      <Stack.Screen name="catalog" />
      <Stack.Screen name="stardetail" />
      <Stack.Screen name="starmap" options={{ animation: 'fade' }} />
      <Stack.Screen name="starvoyage" options={{ animation: 'fade' }} />
    </Stack>
  );
}
