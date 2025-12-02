import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otp-store';

// Mock admin data
const mockAdmin = {
  id: '1',
  email: 'super@iitian-squad.com',
  name: 'Super Admin',
  roleId: '1',
  role: {
    id: '1',
    name: 'Super Admin',
    type: 'super_admin',
    permissions: [
      'exam_management',
      'subject_management',
      'paper_management',
      'question_management',
      'blog_management',
      'author_management',
      'media_management',
      'admin_management',
      'bulk_upload',
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isActive: true,
  passwordSet: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function POST(request: NextRequest) {
  try {
    const { email, otp, sessionToken } = await request.json();

    // Get stored OTP
    const storedData = otpStore.get(sessionToken);

    if (!storedData) {
      return NextResponse.json(
        { message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(sessionToken);
      return NextResponse.json(
        { message: 'OTP has expired' },
        { status: 401 }
      );
    }

    // Verify OTP
    if (storedData.otp !== otp || storedData.email !== email) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 401 }
      );
    }

    // OTP verified, delete it
    otpStore.delete(sessionToken);

    // Generate JWT token
    const token = 'jwt-token-' + Date.now();

    // TODO: Update last login time in database

    return NextResponse.json({
      token,
      admin: mockAdmin,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
