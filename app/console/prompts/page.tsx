import { Metadata } from 'next';

import Prompts from '@/components/console/prompts';

export const metadata: Metadata = {
  title: 'Prompts'
};

export default function PromptsPage() {
  return <Prompts />;
}
