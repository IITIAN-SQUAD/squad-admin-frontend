import { Metadata } from 'next';
import LoginForm from '@/src/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login - IITian Squad Admin',
  description: 'Sign in to access the admin dashboard',
};

export default function LoginPage() {
  return <LoginForm />;
}
