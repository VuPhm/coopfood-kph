declare module "exifr/dist/lite.esm.mjs" {
  export function parse(data: Blob, options?: readonly string[]): Promise<Record<string, unknown> | undefined>;
}
