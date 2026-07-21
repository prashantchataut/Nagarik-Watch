export async function put(): Promise<never> {
  throw new Error('Vercel Blob is not available on this deployment.')
}

export async function del(): Promise<void> {}

export async function list(): Promise<{ blobs: [] }> {
  return { blobs: [] }
}
