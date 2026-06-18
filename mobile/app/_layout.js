import '../polyfills';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { ensureStarData } from '../src/data/starLoader';
import { createStarTargetFromStar, resolveStarTarget } from '../src/utils/starIdentity';
import { syncOwnershipSnapshot } from '../src/data/ownershipSnapshot';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cinzel_400Regular, Cinzel_700Bold });
  const router = useRouter();

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
      const { hostname, path } = Linking.parse(url);
      // Expecting starcalimx://star/{starClaimCode} or starcalimx://hip/{hipId}
      // hostname is 'star' or 'hip', path is the identifier
      const type = hostname;
      const identifier = path;

      if (!type || !identifier) return;

      // Ensure star data is loaded
      ensureStarData().then((stars) => {
        let target = {};
        if (type === 'star') {
          target.starClaimCode = identifier;
        } else if (type === 'hip') {
          target.hip = identifier;
        } else {
          return; // unsupported type
        }

        const foundStar = resolveStarTarget(stars, target);
        if (foundStar) {
          const starTarget = createStarTargetFromStar(foundStar);
          // Navigate to 2D map screen with starTarget as params
          router.replace({
            pathname: '/(tabs)/explore/starmap',
            params: {
              starId: starTarget.id,
              hip: starTarget.hip,
              hd: starTarget.hd,
              properName: starTarget.properName,
              name: starTarget.name,
              starClaimCode: starTarget.starClaimCode,
              raHours: starTarget.raHours,
              raDegrees: starTarget.raDegrees,
              decDegrees: starTarget.decDegrees,
              distanceParsec: starTarget.distanceParsec,
              magnitude: starTarget.magnitude,
              spectralType: starTarget.spectralType,
              constellation: starTarget.constellation,
            }
          });
        }
      });
    } catch (e) {
      console.warn('Failed to parse deep link:', url, e);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <>
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
        <Stack.Screen name="vault" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
