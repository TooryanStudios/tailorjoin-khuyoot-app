import { describe, it, expect } from 'vitest';
import { handleTryOnFabric } from './tryonHandler';

const ctx = {
  ip: '127.0.0.1',
  headers: {},
};

describe('handleTryOnFabric validation', () => {
  it('rejects missing garmentTemplateId', async () => {
    const res = await handleTryOnFabric({ options: {} }, ctx as any);
    expect(res.status).toBe(400);
    expect(res.json.status).toBe('failed');
  });

  it('rejects missing fabric', async () => {
    const res = await handleTryOnFabric({ garmentTemplateId: 'dress', options: {} }, ctx as any);
    expect(res.status).toBe(400);
    expect(res.json.status).toBe('failed');
  });

  it('rejects unknown template id', async () => {
    const res = await handleTryOnFabric(
      {
        garmentTemplateId: 'not-a-template',
        fabricImageBase64: 'AAAA',
        fabricMimeType: 'image/png',
        options: {},
      },
      ctx as any
    );
    expect(res.status).toBe(400);
    expect(res.json.status).toBe('failed');
  });
});
