import React from 'react';
import { Home } from './Home';

/**
 * HomeClassic - Forces the old/classic homepage to render
 * regardless of the enableHomepageV2 setting.
 * 
 * Accessible via /home-classic route while Homepage V2.1 is enabled.
 */
export const HomeClassic: React.FC = () => {
  return <Home forceClassic />;
};
