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
    
    // Only redirect if both token and admin exist AND admin is valid JSON
    if (token && admin && admin !== 'null' && admin !== 'undefined') {
      try {
        const parsedAdmin = JSON.parse(admin);
        if (parsedAdmin && parsedAdmin.id) {
          console.log('Already authenticated, redirecting to dashboard');
          router.replace('/');
        }
      } catch (e) {
        // Invalid admin data, clear it
        console.log('Invalid admin data, clearing...');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin');
      }
    }
  }, [router]);

  return <LoginForm />;
}
