import { NextRequest, NextResponse } from 'next/server';
import { otpStore, generateOTP } from '@/lib/otp-store';

// Mock admin data - replace with actual database
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
    const { email, password } = await request.json();

    // TODO: Replace with actual authentication logic
    // - Hash password comparison
    // - Database query
    
    if (email === 'super@iitian-squad.com' && password === 'password123') {
      // Generate OTP
      const otp = generateOTP();
      const sessionToken = 'session-' + Date.now() + '-' + Math.random().toString(36);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store OTP
      otpStore.set(sessionToken, { otp, expiresAt, email });
      
      // TODO: Send OTP via email
      console.log(`OTP for ${email}: ${otp}`); // For development
      
      return NextResponse.json({
        requireMFA: true,
        sessionToken,
        message: 'OTP sent to your email',
      });
    }

    return NextResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
