import React from 'react';
import { Robot } from '@phosphor-icons/react';

import { Provider } from '@/lib/types';
import {
  IconClaudeAI,
  IconDeepSeek,
  IconGoogleAI,
  IconGork,
  IconOpenAI
} from '@/components/ui/icons';

interface ModelIconProps {
  provider?: Provider;
}

export const ModelIcon = ({ provider }: ModelIconProps) => {
  switch (provider) {
    case 'openai':
      return <IconOpenAI />;
    case 'google':
      return <IconGoogleAI />;
    case 'anthropic':
      return <IconClaudeAI />;
    case 'xai':
      return <IconGork />;
    case 'deepseek':
      return <IconDeepSeek />;
    default:
      return <Robot />;
  }
};
