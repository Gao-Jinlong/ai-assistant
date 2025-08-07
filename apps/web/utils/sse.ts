export function parseSSEMessage(chunk: string) {
  if (!chunk) {
    return null;
  }

  chunk = chunk.trim();
  if (!chunk.startsWith('data:')) {
    return null;
  }
  chunk = chunk.slice(5);

  const data = JSON.parse(chunk);
  return data;
}
