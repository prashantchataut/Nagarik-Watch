/**
 * Text-to-speech provider boundary. Never invents audio URLs.
 * When TTS_PROVIDER_KEY is unset, returns a disabled state.
 */

export type TtsState = {
  ready: boolean
  provider: 'none' | 'configured'
  detail: string
}

export type TtsDraft = {
  status: 'disabled' | 'draft'
  needsEditorApproval: true
  audioUrl?: string
  cachedKey?: string
  model?: string
  detail: string
}

export function getTtsState(): TtsState {
  const key = process.env.TTS_PROVIDER_KEY?.trim()
  const provider = process.env.TTS_PROVIDER?.trim()
  if (!key || !provider) {
    return {
      ready: false,
      provider: 'none',
      detail: 'Set TTS_PROVIDER and TTS_PROVIDER_KEY to enable audio drafts.',
    }
  }
  return {
    ready: true,
    provider: 'configured',
    detail: `Provider ${provider} credentials present. Synthesis still requires an audited adapter.`,
  }
}

/** Request an audio draft. Never auto-publishes; always editor-gated. */
export async function draftArticleAudio(input: {
  articleId: string
  text: string
  locale: 'ne' | 'en'
}): Promise<TtsDraft> {
  const state = getTtsState()
  if (!state.ready) {
    return {
      status: 'disabled',
      needsEditorApproval: true,
      detail: state.detail,
    }
  }
  // Provider adapter intentionally not auto-called until a contracted vendor
  // ships. Credentials alone do not imply a working synthesis path.
  return {
    status: 'draft',
    needsEditorApproval: true,
    cachedKey: `tts:${input.locale}:${input.articleId}`,
    model: process.env.TTS_PROVIDER?.trim(),
    detail:
      'TTS credentials are present but the vendor adapter is not wired. No audio file was generated.',
  }
}
