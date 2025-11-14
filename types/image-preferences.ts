export type ImageSize = '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792';

export type ImageAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

export type ImagePreferences = {
  model: string;
  size: ImageSize;
  aspectRatio: ImageAspectRatio;
};
