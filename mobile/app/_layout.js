import '../polyfills';
import React from 'react';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';

export default function Layout() {
  const [fontsLoaded] = useFonts({ Cinzel_400Regular, Cinzel_700Bold });
  if (!fontsLoaded) return null;
  return <Slot />;
}
