import { NextRequest, NextResponse } from 'next/server';
import { otpStore, generateOTP } from '@/lib/otp-store';

export async function POST(request: NextRequest) {
  try {
    const { email, sessionToken } = await request.json();

    // Verify session exists
    const storedData = otpStore.get(sessionToken);

    if (!storedData || storedData.email !== email) {
      return NextResponse.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update OTP
    otpStore.set(sessionToken, { otp, expiresAt, email });

    // TODO: Send OTP via email
    console.log(`New OTP for ${email}: ${otp}`); // For development

    return NextResponse.json({
      message: 'OTP resent successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
