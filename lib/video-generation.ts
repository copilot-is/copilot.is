import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

import { env } from './env';

export type VideoGenerationParams = {
  model: string;
  prompt: string;
  aspectRatio?: `${number}:${number}`;
  duration?: number;
};

export type VideoGenerationResult = {
  buffer: Buffer;
  mediaType: string;
};

/**
 * Create OpenAI client instance
 */
function createOpenAIClient(): OpenAI {
  const isAzure = env.OPENAI_API_PROVIDER === 'azure';

  if (isAzure) {
    throw new Error(
      'Azure OpenAI Sora is not implemented yet. Please use direct OpenAI API.'
    );
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL
  });
}

/**
 * Generate video using OpenAI Sora 2 API
 * Documentation: https://platform.openai.com/docs/guides/video-generation
 */
async function generateWithSora(
  model: string,
  prompt: string,
  aspectRatio?: `${number}:${number}`,
  duration?: number
): Promise<VideoGenerationResult> {
  const openai = createOpenAIClient();

  // Determine video size based on aspect ratio
  // Sora 2 supports: 720x1280, 1280x720, 1024x1792, 1792x1024
  const size = aspectRatio === '9:16' ? '720x1280' : '1280x720';

  // Determine duration in seconds (4, 8, or 12)
  const seconds: '4' | '8' | '12' =
    duration && duration <= 4 ? '4' : duration && duration <= 8 ? '8' : '12';

  console.log('Starting Sora video generation:', {
    model,
    prompt,
    size,
    seconds
  });

  // Create video generation request
  const video = await openai.videos.create({
    model: model as any, // 'sora-2' | 'sora-2-pro'
    prompt,
    size: size as any,
    seconds
  });

  console.log('Video generation started:', video);

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
  console.log('Polling video job:', jobId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Retrieve video status
    const video = await openai.videos.retrieve(jobId);

    console.log(
      `Poll attempt ${attempt + 1}/${maxAttempts}, status:`,
      video.status,
      `progress: ${video.progress}%`
    );

    if (video.status === 'completed') {
      console.log('Video generation completed');
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

/**
 * Generate video using Google Veo API
 * Supported models:
 * - veo-2.0-generate-001
 * - veo-3.0-fast-generate-001
 * - veo-3.0-generate-001
 * - veo-3.1-fast-generate-preview
 * - veo-3.1-generate-preview
 *
 * Documentation: https://ai.google.dev/api/generate-video
 */
async function generateWithVeo(
  model: string,
  prompt: string,
  aspectRatio?: `${number}:${number}`,
  duration?: number
): Promise<VideoGenerationResult> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required for Veo');
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log('Starting Veo video generation:', {
    model,
    prompt,
    aspectRatio,
    duration
  });

  // Create video generation request
  let operation = await ai.models.generateVideos({
    model: model,
    prompt: prompt
  });

  console.log('Video generation started:', operation);

  // Poll the operation status until the video is ready
  let attempts = 0;
  const maxAttempts = 60; // 10 minutes max (60 * 10s)

  while (!operation.done && attempts < maxAttempts) {
    console.log(
      `Waiting for video generation to complete... (attempt ${attempts + 1}/${maxAttempts})`
    );
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    operation = await ai.operations.getVideosOperation({
      operation: operation
    });

    attempts++;
  }

  if (!operation.done) {
    throw new Error('Veo video generation timed out after 10 minutes');
  }

  if (!operation.response?.generatedVideos?.[0]?.video) {
    throw new Error('No video data in Veo response');
  }

  // Get the video file
  const videoFile = operation.response.generatedVideos[0].video;

  if (!videoFile.uri) {
    throw new Error('No video URI in Veo response');
  }

  // Fetch the video content from the URI
  const videoResponse = await fetch(videoFile.uri);

  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
  }

  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  console.log('Video generation completed, size:', videoBuffer.length);

  return {
    buffer: videoBuffer,
    mediaType: videoFile.mimeType || 'video/mp4'
  };
}

/**
 * Generate video using the specified model
 */
export async function generateVideo(
  params: VideoGenerationParams
): Promise<VideoGenerationResult> {
  const { model, prompt, aspectRatio, duration } = params;

  // Check if model is a Sora variant
  if (model === 'sora-2' || model === 'sora-2-pro' || model === 'sora') {
    return generateWithSora(
      model === 'sora' ? 'sora-2' : model,
      prompt,
      aspectRatio,
      duration
    );
  }

  // Check if model is Veo
  if (model.startsWith('veo-')) {
    return generateWithVeo(model, prompt, aspectRatio, duration);
  }

  throw new Error(`Unsupported video model: ${model}`);
}
