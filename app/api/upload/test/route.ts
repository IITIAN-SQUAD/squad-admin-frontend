import { NextResponse } from 'next/server';

export async function GET() {
  // Test S3 configuration without exposing secrets
  const config = {
    hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    hasBucketName: !!process.env.S3_BUCKET_NAME,
    hasRegion: !!process.env.AWS_REGION,
    accessKeyIdPrefix: process.env.AWS_ACCESS_KEY_ID?.substring(0, 4) || 'NOT SET',
    bucketName: process.env.S3_BUCKET_NAME || 'NOT SET',
    region: process.env.AWS_REGION || 'NOT SET',
  };

  return NextResponse.json({
    message: 'S3 Configuration Test',
    config,
    allConfigured: config.hasAccessKeyId && config.hasSecretAccessKey && config.hasBucketName && config.hasRegion,
  });
}
