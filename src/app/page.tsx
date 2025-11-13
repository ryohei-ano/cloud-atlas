'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 常にspaceページにリダイレクト（匿名アクセス可能）
    router.replace('/space');
  }, [router]);

  return null;
}
