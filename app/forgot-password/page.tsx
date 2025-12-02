import { Metadata } from 'next';
import ForgotPasswordForm from '@/src/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password - IITian Squad Admin',
  description: 'Reset your admin password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
