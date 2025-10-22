export async function* asyncIterableToGenerator<T = unknown>(
  iterable: AsyncIterable<T>,
) {
  for await (const chunk of iterable) {
    yield chunk;
  }
}

export function parseSSEMessage(message: `data: ${string}`): unknown {
  if (!message.startsWith('data:')) {
    return null;
  }

  const data = message.split('data:')[1];
  if (!data) {
    return null;
  }

  return JSON.parse(data);
}
