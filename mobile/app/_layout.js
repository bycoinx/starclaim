import '../polyfills';
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, BackHandler } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Global Back Button Safety (Task 10.1 / Diagnosis)
  useEffect(() => {
    const onBackPress = () => {
      try {
        if (router.canGoBack()) {
          router.back();
          return true;
        }
      } catch (e) {
        console.warn("Navigation back failed", e);
      }
      return false; // Exit app or default system behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#000',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'StarClaim' }} />
      </Stack>
    </>
  );
}
