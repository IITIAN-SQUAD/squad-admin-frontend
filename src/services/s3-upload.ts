/**
 * S3 Upload Service
 * 
 * This file contains the logic for uploading images to AWS S3 and generating short URLs.
 * 
 * PRODUCTION SETUP:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 2. Set environment variables in .env.local:
 *    - NEXT_PUBLIC_AWS_REGION=us-east-1
 *    - NEXT_PUBLIC_AWS_BUCKET_NAME=your-bucket-name
 *    - AWS_ACCESS_KEY_ID=your-access-key
 *    - AWS_SECRET_ACCESS_KEY=your-secret-key
 * 3. Configure S3 bucket with CORS and public read permissions
 * 4. Optionally use CloudFront CDN for better performance
 * 5. Use a URL shortener service or create custom short URLs
 */

// Uncomment for production use:
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface UploadResult {
  success: boolean;
  url?: string;
  shortUrl?: string;
  error?: string;
}

/**
 * Mock upload function for development
 * Replace with actual S3 upload in production
 */
export async function uploadToS3(
  file: File,
  folder: string = 'questions'
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // MOCK IMPLEMENTATION - Replace with actual S3 upload
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const mockS3Url = `https://s3.amazonaws.com/your-bucket/${folder}/${generateFileName(file)}`;
        const mockShortUrl = `https://s3.exam.io/${generateShortId()}`;

        resolve({
          success: true,
          url: reader.result as string, // In dev, use data URL
          shortUrl: mockShortUrl
        });
      };
      reader.readAsDataURL(file);
    });

    /* PRODUCTION IMPLEMENTATION:
    
    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const fileName = generateFileName(file);
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read', // or use CloudFront for private buckets
    });

    await s3Client.send(command);

    const fullUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
    
    // Option 1: Use URL shortener service
    const shortUrl = await shortenUrl(fullUrl);
    
    // Option 2: Create custom short URL mapping in your database
    // const shortUrl = await createShortUrl(fullUrl);

    return {
      success: true,
      url: fullUrl,
      shortUrl: shortUrl
    };
    */

  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Generate unique filename
 */
function generateFileName(file: File): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Generate short ID for mock URLs
 */
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * URL Shortener Integration
 * You can integrate with services like:
 * - bit.ly API
 * - TinyURL API
 * - Your own URL shortener
 */
async function shortenUrl(longUrl: string): Promise<string> {
  /* Example with bit.ly:
  
  const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BITLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ long_url: longUrl })
  });

  const data = await response.json();
  return data.link;
  */

  // Mock implementation
  return `https://short.link/${generateShortId()}`;
}

/**
 * Delete image from S3
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    /* PRODUCTION IMPLEMENTATION:
    
    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    */
    
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
}

/**
 * Generate presigned URL for private objects
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  /* PRODUCTION IMPLEMENTATION:
  
  const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new GetObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
  */

  // Mock implementation
  return `https://s3.amazonaws.com/mock-bucket/${key}?expires=${Date.now() + expiresIn * 1000}`;
}
