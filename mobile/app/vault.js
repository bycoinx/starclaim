import React from 'react';
import { Redirect } from 'expo-router';
import { ROUTES } from '../src/platform/navigation/routes';

export default function VaultRedirect() {
  return <Redirect href={ROUTES.vaultHome} />;
}
