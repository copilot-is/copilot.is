import { providerFromModel } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';

export function EmptyScreen() {
  const { model } = useSettings();
  const provider = providerFromModel(model);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center px-4 py-8">
      <div className="mb-4 flex items-center justify-center rounded-full border">
        {provider === 'openai' && <IconOpenAI className="m-2.5 size-7" />}
        {provider === 'google' && <IconGoogleAI className="m-2.5 size-7" />}
        {provider === 'anthropic' && <IconClaudeAI className="m-2.5 size-7" />}
      </div>
      <div className="text-lg font-medium lg:text-2xl">
        How can I help you today?
      </div>
    </div>
  );
}
