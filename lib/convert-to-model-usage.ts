import { ServiceProvider } from '@/lib/constant';
import { Usage } from '@/lib/types';
import { formatString, isImageModel, providerFromModel } from '@/lib/utils';

export function convertToModelUsage(usage: Usage): Usage {
  const generalFields = ['model', 'stream', 'previewToken'];
  const providerFields = {
    openai: [
      'temperature',
      'frequencyPenalty',
      'presencePenalty',
      'topP',
      'maxTokens'
    ],
    google: ['temperature', 'topP', 'topK', 'maxTokens'],
    anthropic: ['temperature', 'topP', 'topK', 'maxTokens']
  };

  const image = isImageModel(usage.model);
  const provider = providerFromModel(usage.model);
  const fields = generalFields.concat(providerFields[provider]);

  const newUsage = {} as Usage;

  if (!image && usage.prompt) {
    const model = usage.model;
    const time = new Date().toLocaleString();
    const systemPrompt = formatString(usage.prompt, {
      provider: ServiceProvider[provider],
      model,
      time
    });
    newUsage['prompt'] = systemPrompt;
  }

  for (const field of fields) {
    if (
      usage[field] !== undefined &&
      usage[field] !== null &&
      usage[field] !== ''
    ) {
      newUsage[field] = usage[field];
    }
  }

  return newUsage;
}
