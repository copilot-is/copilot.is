import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Settings'
};

export default function Page() {
  redirect('/settings/general');
}
