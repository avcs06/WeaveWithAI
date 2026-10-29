import { describe, expect, it } from 'vitest';
import { resolveBackend } from './backends';
import type { Config } from './env';

const config: Config = {
  MODEL_API_KEY: 'meta-key',
  LLM_BASE_URL: 'https://api.meta.ai/v1',
  LLM_MODEL: 'muse-spark-1.3',
  LLM_MODEL_STRONG: 'muse-wonder-1.0',
  LLM_MODEL_VISION: 'muse-spark-1.3',
  LLM_REPLAY: true,
  LLM_BACKEND: 'meta',
  BASETEN_BASE_URL: 'https://inference.baseten.co/v1',
};
const modal = {
  MODAL_BASE_URL: 'https://acme--ep-hackathon-server.us-west.modal.direct/v1',
  MODAL_PROXY_TOKEN: 'wk-id.ws-secret',
  MODAL_MODEL: 'hackathon',
};
const baseten = { BASETEN_API_KEY: 'bt-key', BASETEN_MODEL: 'meta-models/muse-spark-open' };

describe('resolveBackend', () => {
  it('meta uses the Model API variables', () => {
    expect(resolveBackend(config)).toEqual({
      name: 'meta',
      baseURL: 'https://api.meta.ai/v1',
      apiKey: 'meta-key',
      model: 'muse-spark-1.3',
      strongModel: 'muse-wonder-1.0',
    });
  });

  it('modal uses its endpoint variables; strong is the same model', () => {
    expect(resolveBackend({ ...config, ...modal }, 'modal')).toEqual({
      name: 'modal',
      baseURL: modal.MODAL_BASE_URL,
      apiKey: 'wk-id.ws-secret',
      model: 'hackathon',
      strongModel: 'hackathon',
    });
  });

  it('baseten needs its key and model slug; strong is the same model', () => {
    expect(resolveBackend({ ...config, ...baseten }, 'baseten')).toEqual({
      name: 'baseten',
      baseURL: 'https://inference.baseten.co/v1',
      apiKey: 'bt-key',
      model: 'meta-models/muse-spark-open',
      strongModel: 'meta-models/muse-spark-open',
    });
  });

  it('names every missing variable', () => {
    expect(() => resolveBackend({ ...config, LLM_BACKEND: 'modal' })).toThrow(
      'Backend modal needs MODAL_BASE_URL, MODAL_PROXY_TOKEN, MODAL_MODEL set in .env',
    );
    expect(() => resolveBackend(config, 'baseten')).toThrow(
      'Backend baseten needs BASETEN_API_KEY, BASETEN_MODEL set in .env',
    );
  });

  it('rejects an unknown override', () => {
    expect(() => resolveBackend(config, 'cloud')).toThrow('Unknown backend cloud; use one of meta, modal, baseten');
  });
});
