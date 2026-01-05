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
    let utils: ReturnType<typeof render>;
    await act(async () => {
      utils = render(
        <MemoryRouter>
          <AppProvider>
            <TryFabricPanel initialTemplateId="dress" onApplyResult={onApplyResult} />
          </AppProvider>
        </MemoryRouter>
      );
    });

    const { getAllByText, getByRole, findByRole } = utils!;

    // Open fabric picker modal
    await act(async () => {
      (getAllByText('اختر القماش')[0] as HTMLElement).click();
    });

    // Upload fabric via the modal's hidden input
    const file = new File([new Uint8Array([1, 2, 3])], 'fabric.png', { type: 'image/png' });
    const input = document.getElementById('tryon-fabric-upload') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    await act(async () => {
      Object.defineProperty(input!, 'files', { value: [file] });
      input!.dispatchEvent(new Event('change', { bubbles: true }));
    });

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
