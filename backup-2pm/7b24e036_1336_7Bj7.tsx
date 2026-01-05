import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TryFabricPanel } from './TryFabricPanel';
import { AppProvider } from '../../../context/AppContext';

describe('TryFabricPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AppProvider>
          <TryFabricPanel
            useExternalCards
            initialTemplateId="dress"
            externalTemplateImageUrl="data:image/png;base64,AAAA"
            externalFabricImageUrl="data:image/png;base64,AAAA"
            onApplyResult={() => {}}
          />
        </AppProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
