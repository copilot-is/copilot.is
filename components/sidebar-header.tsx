'use client';

import * as React from 'react';
import Link from 'next/link';

export function SidebarHeader() {
  const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME;

  return (
    <Link
      href="/"
      className="flex items-center gap-2 px-4 py-3 text-lg font-medium"
    >
      <img src="/favicon.svg" alt="Logo" className="h-7 w-7" />
      <span>{productName}</span>
    </Link>
  );
}
