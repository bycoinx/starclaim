import '../polyfills';
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { ensureStarData } from '../src/data/starLoader';
import { syncOwnershipSnapshot } from '../src/data/ownershipSnapshot';
import { resolveParsedDeepLinkRoute } from '../src/platform/navigation/deepLinks';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cinzel_400Regular, Cinzel_700Bold });
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    Promise.all([
      NavigationBar.setBackgroundColorAsync('#02040A'),
      NavigationBar.setButtonStyleAsync('light'),
      NavigationBar.setVisibilityAsync('visible'),
    ]).catch((error) => console.warn('Navigation bar setup deferred', error));
    return undefined;
  }, []);

  useEffect(() => {
    // Handle initial link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for incoming links while app is foregrounded
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const sync = () => syncOwnershipSnapshot().catch((error) => {
      console.log('Ownership sync deferred', error.message);
    });
    sync();
    const interval = setInterval(sync, 60000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url) => {
    try {
      const parsedLink = Linking.parse(url);
      const immediateRoute = resolveParsedDeepLinkRoute(parsedLink, []);
      if (immediateRoute) {
        router.replace(immediateRoute);
        return;
      }
      ensureStarData().then((stars) => {
        const route = resolveParsedDeepLinkRoute(parsedLink, stars);
        if (route) router.replace(route);
      });
    } catch (e) {
      console.warn('Failed to parse deep link:', url, e);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="stars" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="neural-link" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="qr-login" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="debug" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="vault" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
