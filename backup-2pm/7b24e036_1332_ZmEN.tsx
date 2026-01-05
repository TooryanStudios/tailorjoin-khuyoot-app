import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TryFabricPanel } from './TryFabricPanel';
import { AppProvider } from '../../../context/AppContext';

vi.mock('../../services/tryonService', () => {
  return {
    generateTryOn: vi.fn(async () => ({
      jobId: 'job-123',
      status: 'completed',
      resultImageUrl: 'https://example.com/result.png',
    })),
  };
});

vi.mock('../../utils/imageResize', () => {
  return {
    resizeImage: vi.fn(async (file: File) => file),
  };
});

vi.mock('../../utils/fileToBase64', () => {
  return {
    fileToBase64: vi.fn(async () => ({ base64: 'AAAA', mimeType: 'image/png' })),
  };
});

describe('TryFabricPanel', () => {
  it('calls API and renders result', async () => {
    const onApplyResult = vi.fn();
    (window as any).scrollTo = vi.fn();
    let utils: ReturnType<typeof render>;
    await act(async () => {
      utils = render(
        <MemoryRouter>
          <AppProvider>
            <TryFabricPanel
              useExternalCards
              initialTemplateId="dress"
              externalTemplateImageUrl="data:image/png;base64,AAAA"
              externalFabricImageUrl="data:image/png;base64,AAAA"
              onApplyResult={onApplyResult}
            />
          </AppProvider>
        </MemoryRouter>
      );
    });

    const { getAllByText, getByRole, findByRole } = utils!;

    await React.act(async () => {
      (getByRole('button', { name: /توليد/i }) as HTMLButtonElement).click();
    });

    // Result card appears (async)
    const saveBtn = await findByRole('button', { name: /حفظ إلى المشروع/i });
    expect(saveBtn).toBeInTheDocument();

    await React.act(async () => {
      (saveBtn as HTMLButtonElement).click();
    });
    expect(onApplyResult).toHaveBeenCalledWith({ jobId: 'job-123', resultImageUrl: 'https://example.com/result.png' });
  });
});
