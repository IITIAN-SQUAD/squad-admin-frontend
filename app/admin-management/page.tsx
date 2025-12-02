import { Metadata } from 'next';
import AdminManagementContent from '@/src/components/admin/AdminManagementContent';

export const metadata: Metadata = {
  title: 'Admin Management - IITian Squad Admin',
  description: 'Manage admin users and permissions',
};

export default function AdminManagementPage() {
  return <AdminManagementContent />;
}
