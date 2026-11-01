/** Huella SHA-256 en hexadecimal, la misma que calcula el analizador preliminar. */
export async function sha256Hex(data: ArrayBuffer | Blob): Promise<string> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
