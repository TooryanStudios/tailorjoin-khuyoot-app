import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TryFabricPanel } from './TryFabricPanel';

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
    const { getByLabelText, getByRole, findByRole } = render(
      <TryFabricPanel initialTemplateId="dress" onApplyResult={onApplyResult} />
    );

    const file = new File([new Uint8Array([1, 2, 3])], 'fabric.png', { type: 'image/png' });
    const input = getByLabelText('قماش (لقطة قريبة فقط)') as HTMLInputElement;
    await React.act(async () => {
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
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
