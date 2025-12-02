import { Metadata } from 'next';
import { Suspense } from "react";
import SetPasswordContent from '@/src/components/auth/SetPasswordContent';

export const metadata: Metadata = {
  title: 'Set Password - IITian Squad Admin',
  description: 'Set your admin password',
};

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SetPasswordContent />
      </Suspense>
    </div>
  );
}
