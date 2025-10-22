export async function* asyncIterableToGenerator<T = unknown>(
  iterable: AsyncIterable<T>,
) {
  for await (const chunk of iterable) {
    yield chunk;
  }
}
