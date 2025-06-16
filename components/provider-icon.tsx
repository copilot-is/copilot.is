import React from 'react';
import { Robot } from '@phosphor-icons/react';

import { Provider } from '@/types';
import {
  IconClaudeAI,
  IconDeepSeek,
  IconGoogleAI,
  IconGork,
  IconOpenAI
} from '@/components/ui/icons';

interface ProviderIconProps {
  provider?: Provider;
  className?: string;
}

export const ProviderIcon = ({ provider, className }: ProviderIconProps) => {
  switch (provider) {
    case 'openai':
      return <IconOpenAI className={className} />;
    case 'google':
      return <IconGoogleAI className={className} />;
    case 'anthropic':
      return <IconClaudeAI className={className} />;
    case 'xai':
      return <IconGork className={className} />;
    case 'deepseek':
      return <IconDeepSeek className={className} />;
    default:
      return <Robot className={className} />;
  }
};
