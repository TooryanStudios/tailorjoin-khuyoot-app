import React from 'react';
import { ProductDetails } from '../../../pages/ProductDetails';
import { useMobileDetection } from '../../modules/designer/mobile';
import { DemoShellPageBMobile } from './DemoShellPageB.Mobile';
import { DemoShellPageBDesktop } from './DemoShellPageB.Desktop';

export function DemoShellPageB() {
  const isMobile = useMobileDetection();
  
  if (isMobile) {
    return <DemoShellPageBMobile />;
  }
  
  return <DemoShellPageBDesktop />;
}
