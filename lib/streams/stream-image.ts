import { formatDataStreamPart } from 'ai';
import { type ImagesResponse } from 'openai/resources/images';

export function streamImage(images: ImagesResponse): {
  toDataStreamResponse: () => Response;
} {
  if (!images || !images.data || images.data.length === 0) {
    throw new Error('No image data available');
  }

  const toDataStreamResponse = (): Response => {
    const stream = new ReadableStream({
      start(controller) {
        for (const image of images.data) {
          if (image.b64_json) {
            controller.enqueue(
              formatDataStreamPart(
                'text',
                `![](data:image/png;base64,${image.b64_json})`
              )
            );
          }
          if (image.url) {
            controller.enqueue(
              formatDataStreamPart('text', `![](${image.url})`)
            );
          }
          if (image.revised_prompt) {
            controller.enqueue(
              formatDataStreamPart('text', `\n\n${image.revised_prompt}`)
            );
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
    });
  };

  return { toDataStreamResponse };
}
