'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/src/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    const token = localStorage.getItem('auth_token');
    const admin = localStorage.getItem('admin');
    
    if (token && admin) {
      console.log('Already authenticated, redirecting to dashboard');
      router.replace('/');
    }
  }, [router]);

  return <LoginForm />;
}
