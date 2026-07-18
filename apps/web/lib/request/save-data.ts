const REDUCED_DATA_VALUES = new Set(['?1', '1', 'on', 'reduce'])

export function requestWantsSaveData(headers: Headers): boolean {
  if (headers.get('save-data')?.trim().toLowerCase() === 'on') return true

  const reducedDataPreference = headers
    .get('sec-ch-prefers-reduced-data')
    ?.trim()
    .toLowerCase()

  return reducedDataPreference ? REDUCED_DATA_VALUES.has(reducedDataPreference) : false
}
