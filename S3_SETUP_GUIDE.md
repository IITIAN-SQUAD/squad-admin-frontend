# AWS S3 Image Upload - Setup Guide

## ✅ Implementation Complete!

The S3 image upload functionality has been fully integrated into your codebase. Follow these steps to set it up:

---

## 📦 Step 1: Install Dependencies

```bash
npm install @aws-sdk/client-s3
```

---

## 🔑 Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_REGION=us-east-1
S3_BUCKET_NAME=iitian-squad-questions
```

---

## 🪣 Step 3: Create S3 Bucket

### 1. Go to AWS S3 Console
https://console.aws.amazon.com/s3/

### 2. Create Bucket
- Click **"Create bucket"**
- Name: `iitian-squad-questions` (or your preferred name)
- Region: `us-east-1` (or your preferred region)
- **Uncheck** "Block all public access" (we need public read access for images)
- Click **"Create bucket"**

### 3. Configure Bucket Policy

Go to your bucket → **Permissions** → **Bucket Policy**, paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::iitian-squad-questions/*"
    }
  ]
}
```

Replace `iitian-squad-questions` with your bucket name.

### 4. Configure CORS

Go to **Permissions** → **CORS**, paste this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Replace `https://yourdomain.com` with your production domain.

---

## 🔐 Step 4: Create IAM User

### 1. Go to IAM Console
https://console.aws.amazon.com/iam/

### 2. Create User
- Click **"Users"** → **"Add user"**
- Username: `iitian-squad-s3-uploader`
- Access type: **"Programmatic access"**

### 3. Attach Policy
Create inline policy with this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::iitian-squad-questions",
        "arn:aws:s3:::iitian-squad-questions/*"
      ]
    }
  ]
}
```

### 4. Save Credentials
- Copy **Access Key ID** → Add to `.env.local` as `AWS_ACCESS_KEY_ID`
- Copy **Secret Access Key** → Add to `.env.local` as `AWS_SECRET_ACCESS_KEY`

---

## 🎯 Files Created

### 1. **Service Layer**
- `/src/services/s3-upload.service.ts` - S3 upload service with progress tracking

### 2. **API Routes**
- `/app/api/upload/route.ts` - Upload endpoint
- `/app/api/upload/delete/route.ts` - Delete endpoint

### 3. **Components**
- `/src/components/image-upload.tsx` - Reusable upload component with preview
- `/src/components/image-upload-manager.tsx` - Updated to use S3 service

---

## 🚀 Usage Examples

### Basic Upload Component

```tsx
import { ImageUpload } from '@/src/components/image-upload';

function MyComponent() {
  const handleUploadComplete = (url: string, result: any) => {
    console.log('Image uploaded:', url);
    // Insert markdown into editor: ![Image](url)
  };

  return (
    <ImageUpload
      onUploadComplete={handleUploadComplete}
      folder="questions"
      maxSizeMB={10}
    />
  );
}
```

### Image Upload Manager (Advanced)

```tsx
import { ImageUploadManager } from '@/src/components/image-upload-manager';

function QuestionEditor() {
  const handleInsertImage = (markdown: string) => {
    // Insert markdown into your editor
    console.log('Insert:', markdown);
  };

  return (
    <ImageUploadManager onInsertImage={handleInsertImage} />
  );
}
```

### Direct Service Usage

```typescript
import { s3UploadService } from '@/src/services/s3-upload.service';

async function uploadImage(file: File) {
  // Validate first
  const validation = s3UploadService.validateFile(file, 10);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  // Upload with progress
  const result = await s3UploadService.uploadFile(
    file,
    'questions',
    (progress) => {
      console.log(`${progress.percentage}%`);
    }
  );

  console.log('URL:', result.url);
  return result.url;
}
```

---

## 📊 Features

### ✅ Implemented Features

- **Progress Tracking** - Real-time upload progress with percentage
- **Validation** - File type, size, and format checks
- **Preview** - Live image preview before upload
- **Error Handling** - Graceful error messages
- **Markdown Generation** - Auto-generates image markdown
- **Customization** - Width, height, position, alt text
- **Delete Support** - Remove images from S3
- **Multiple Uploads** - Batch upload support

### 📁 Supported Formats

- JPEG / JPG
- PNG
- GIF
- WebP

### 📏 Limits

- **Max file size**: 10MB (configurable)
- **Default folder**: `questions/`
- **Filename**: Auto-sanitized with timestamp

---

## 🔧 Configuration Options

### Upload Service

```typescript
const result = await s3UploadService.uploadFile(
  file,                    // File object
  'questions',             // Folder name
  (progress) => {          // Progress callback
    console.log(progress.percentage);
  }
);
```

### Image Upload Component

```tsx
<ImageUpload
  onUploadComplete={handleComplete}
  onUploadError={handleError}
  folder="questions"
  maxSizeMB={10}
  multiple={false}
  className="custom-class"
/>
```

---

## 🌍 Generated URLs

Format: `https://[bucket].s3.[region].amazonaws.com/[folder]/[filename]`

Example:
```
https://iitian-squad-questions.s3.us-east-1.amazonaws.com/questions/physics_diagram_1731628800_abc123.png
```

---

## 💰 Cost Estimation

### AWS S3 Pricing (us-east-1)

- **Storage**: $0.023 per GB/month
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: Free for first 100GB/month

### Example Cost (1,000 questions with 3 images each):

- Storage (3,000 images × 500KB): ~1.5GB = **$0.03/month**
- Upload (3,000 PUT): **$0.015 one-time**
- Views (100,000 GET): **$0.04**
- **Total**: ~$0.09/month

---

## 🔒 Security

### Implemented

✅ File type validation  
✅ File size limits  
✅ Sanitized filenames  
✅ IAM user with minimal permissions  
✅ Public read-only access  
✅ CORS restrictions  

### Best Practices

- Never commit `.env.local` to Git
- Rotate AWS credentials periodically
- Use separate buckets for dev/prod
- Enable S3 versioning for backups
- Set lifecycle policies to delete old files

---

## 🧪 Testing

### 1. Test Upload

```bash
# Start dev server
npm run dev

# Navigate to: http://localhost:3000/question-onboarding
# Click "Media Library" or use ImageUpload component
# Upload an image
```

### 2. Verify in AWS

- Go to S3 Console
- Check your bucket → `questions/` folder
- Verify image is uploaded
- Try accessing URL in browser

### 3. Test Delete

```typescript
await s3UploadService.deleteFile('questions/image_123.png');
```

---

## 🐛 Troubleshooting

### Error: "S3 not configured"
- Check `.env.local` has all AWS variables
- Restart dev server after adding env vars

### Error: "Access Denied"
- Verify IAM user has S3 permissions
- Check bucket policy allows PutObject
- Ensure credentials are correct

### Error: "CORS policy blocked"
- Add your domain to bucket CORS policy
- Include `http://localhost:3000` for development

### Images not loading
- Check bucket policy allows public read
- Verify URL format is correct
- Check browser console for errors

---

## 📚 Next Steps

1. ✅ Install `@aws-sdk/client-s3`
2. ✅ Add environment variables
3. ✅ Create S3 bucket
4. ✅ Configure bucket policy and CORS
5. ✅ Create IAM user
6. ✅ Test upload functionality
7. 🔄 Integrate with question editor
8. 🔄 Add to bulk upload feature

---

## 🎉 You're All Set!

Your S3 image upload is ready to use. Images will be automatically uploaded to AWS S3 and you'll get public URLs to use in your questions!

For questions or issues, check the AWS S3 documentation:
https://docs.aws.amazon.com/s3/
