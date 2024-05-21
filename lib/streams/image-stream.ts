import {
  AIStream,
  createStreamDataTransformer,
  type AIStreamCallbacksAndOptions
} from 'ai';
import { ImagesResponse } from 'openai/resources';

function fromData(res: ImagesResponse) {
  let data = '';

  for (let i = 0; i < res.data.length; i++) {
    const item = res.data[i];
    const imageData = `data: ![](${item.b64_json ? 'data:image/png;base64,' + item.b64_json : item.url})\n\n`;
    const revisedPrompt = item.revised_prompt
      ? `data: ${item.revised_prompt}\n\n`
      : '';

    if (i !== res.data.length - 1) {
      data += imageData + revisedPrompt;
    } else {
      data += imageData + revisedPrompt + 'data: [DONE]';
    }
  }

  return data;
}

export function ImageStream(
  res: ImagesResponse,
  cb?: AIStreamCallbacksAndOptions
): ReadableStream {
  const data = fromData(res);
  const response = new Response(data);
  if (!response.body) {
    throw new Error('The response body is empty.');
  }

  return AIStream(response, undefined, cb).pipeThrough(
    createStreamDataTransformer()
  );
}
