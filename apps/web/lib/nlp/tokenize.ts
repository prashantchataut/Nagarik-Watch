/** Shared tokenizer for the local NLP modules — handles Devanagari danda/double-danda alongside Latin punctuation. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
}

export function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text))
}
