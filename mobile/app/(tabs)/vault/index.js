import React from 'react';
import { Redirect } from 'expo-router';

export default function VaultIndex() {
  return <Redirect href="/(tabs)/vault/home" />;
}
