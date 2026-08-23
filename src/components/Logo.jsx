// src/components/Logo.jsx
// Static PawVaidya logo — paw icon + wordmark, built with react-native-svg
// so no external image asset is required. Replace <PawIcon> with an
// <Image source={require('../assets/logo.png')} /> if/when a final logo
// file is ready — the rest of the app just imports <Logo /> so nothing
// else needs to change.

import React from 'react';
import LogoAsset from '../assests/logo.svg';

export default function Logo({ size = 'medium' }) {
  const dimensions = size === 'small'
    ? { width: 92, height: 34 }
    : size === 'large'
      ? { width: 176, height: 64 }
      : { width: 132, height: 48 };

  return (
    <LogoAsset
      width={dimensions.width}
      height={dimensions.height}
      accessibilityLabel="PawVaidya"
    />
  );
}
