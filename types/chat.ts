import { UIMessage } from '@ai-sdk/ui-utils';

export type Chat = {
  id: string;
  title: string;
  model: string;
  messages: UIMessage[];
  createdAt: Date;
  updatedAt: Date;
};
