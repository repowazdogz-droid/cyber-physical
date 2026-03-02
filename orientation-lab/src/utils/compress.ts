export function encodeUtf8ToBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeBase64UrlToUtf8(input: string): string | null {
  try {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * "Compression" here is URL-safe base64 of UTF-8 JSON.
 * It's not real compression, but it avoids escaping mess and works reliably.
 * If we need true compression later we can swap to LZ-string without changing the API.
 */
export function encodeStateToHash(json: string): string {
  return encodeUtf8ToBase64Url(json);
}

export function decodeStateFromHash(hashPayload: string): string | null {
  return decodeBase64UrlToUtf8(hashPayload);
}

