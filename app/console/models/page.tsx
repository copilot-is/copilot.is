import { Metadata } from 'next';

import Models from '@/components/console/models';

export const metadata: Metadata = {
  title: 'Models'
};

export default function ModelsPage() {
  return <Models />;
}
