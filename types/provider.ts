export type ProviderConfig = {
  type: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  apiOptions?: Record<string, unknown> | null;
};
