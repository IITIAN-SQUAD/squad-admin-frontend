// In-memory OTP storage (use Redis in production)
// Shared across API routes
export const otpStore = new Map<string, { otp: string; expiresAt: number; email: string }>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
