import OpenAI from 'openai';

import type { ProviderConfig } from '@/types';
import { decrypt } from '@/lib/crypto';

export type VideoGenerationResult = {
  buffer: Buffer;
  mediaType: string;
};

/**
 * Create OpenAI client instance
 */
function createOpenAIClient(provider: ProviderConfig): OpenAI {
  if (provider.type === 'azure') {
    throw new Error(
      'Azure OpenAI Sora is not implemented yet. Please use direct OpenAI API.'
    );
  }

  const apiKey = provider.apiKey ? decrypt(provider.apiKey) : undefined;
  return new OpenAI({
    apiKey,
    baseURL: provider.baseUrl || undefined
  });
}

/**
 * Generate video using OpenAI Sora 2 API
 * Documentation: https://platform.openai.com/docs/guides/video-generation
 */
export async function generateWithSora(
  model: string,
  prompt: string,
  provider: ProviderConfig,
  aspectRatio?: `${number}:${number}`,
  resolution?: string,
  duration?: number
): Promise<VideoGenerationResult> {
  const openai = createOpenAIClient(provider);

  // Determine video size based on aspect ratio
  // Sora 2 supports: 720x1280, 1280x720, 1024x1792, 1792x1024
  const size = aspectRatio === '9:16' ? '720x1280' : '1280x720';

  // Determine duration in seconds (4, 8, or 12)
  const seconds: '4' | '8' | '12' =
    duration && duration <= 4 ? '4' : duration && duration <= 8 ? '8' : '12';

  // Create video generation request
  const video = await openai.videos.create({
    model: model as any, // 'sora-2' | 'sora-2-pro'
    prompt,
    size: size as any,
    seconds,
    ...(resolution && { resolution: resolution as any })
  });

  // Poll for completion if not already completed
  if (video.status !== 'completed') {
    await pollSoraJob(openai, video.id);
  }

  // Download video content using the SDK
  const videoResponse = await openai.videos.downloadContent(video.id);
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  return {
    buffer: videoBuffer,
    mediaType: 'video/mp4'
  };
}

/**
 * Poll Sora job status until completion using OpenAI SDK
 */
async function pollSoraJob(
  openai: OpenAI,
  jobId: string,
  maxAttempts = 60
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Retrieve video status
    const video = await openai.videos.retrieve(jobId);

    if (video.status === 'completed') {
      return;
    } else if (video.status === 'failed') {
      throw new Error(
        `Sora video generation failed: ${video.error?.message || 'Unknown error'}`
      );
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Sora video generation timed out after 5 minutes');
}
