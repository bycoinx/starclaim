import React from 'react';
import { Redirect } from 'expo-router';

export default function ExploreIndex() {
  return <Redirect href="/(tabs)/explore/home" />;
}
