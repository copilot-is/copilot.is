import { z } from 'zod';

export const dataContentSchema = z.union([
  z.string(),
  z.instanceof(Uint8Array),
  z.instanceof(ArrayBuffer),
  z.instanceof(URL),
  z.custom(
    (value: unknown): value is Buffer =>
      globalThis.Buffer?.isBuffer(value) ?? false,
    { message: 'Must be a Buffer' }
  )
]);
