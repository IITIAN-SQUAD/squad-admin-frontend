# Image Upload & Markdown Customization Guide

## ✨ Features Implemented

### 1. **Image Upload Manager with S3 Integration**
- Upload images directly to AWS S3
- Generate shortened URLs automatically
- Visual gallery of uploaded images
- One-click markdown insertion

### 2. **Advanced Markdown Image Syntax**
Control image dimensions and positioning with extended markdown syntax:

```markdown
# Basic syntax
![alt text](image-url)

# With width
![alt text](image-url){width=300px}

# With width and height
![alt text](image-url){width=400px height=300px}

# With positioning (left, center, right)
![alt text](image-url){position=left}
![alt text](image-url){position=center}
![alt text](image-url){position=right}

# Full example
![Physics Diagram](https://s3.exam.io/abc123){width=500px height=400px position=center}
```

## 📐 Image Customization Options

### **Width & Height**
- Use any CSS units: `px`, `%`, `em`, `rem`, `auto`
- Examples:
  - `width=300px` - Fixed width
  - `width=50%` - Responsive width
  - `height=auto` - Maintain aspect ratio

### **Position**
- `position=center` (default) - Centers the image
- `position=left` - Floats image to the left, text wraps around right
- `position=right` - Floats image to the right, text wraps around left

### **Examples**

#### Small inline diagram:
```markdown
![Circuit Diagram](url){width=200px position=left}
```

#### Large centered image:
```markdown
![Full Width Graph](url){width=100% position=center}
```

#### Fixed dimensions:
```markdown
![Square Logo](url){width=150px height=150px}
```

## 🚀 Production Setup (AWS S3)

### Step 1: Install AWS SDK
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 2: Configure Environment Variables
Create `.env.local` in your project root:

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_BUCKET_NAME=your-exam-images-bucket
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Optional: URL Shortener
BITLY_ACCESS_TOKEN=your_bitly_token
```

### Step 3: Setup S3 Bucket

1. **Create S3 Bucket:**
   - Go to AWS Console → S3
   - Create a new bucket (e.g., `exam-images-prod`)
   - Choose your region

2. **Configure CORS:**
   Add this CORS configuration to your bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Set Bucket Policy (Public Read):**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-exam-images-bucket/*"
       }
     ]
   }
   ```

4. **Create IAM User:**
   - Create IAM user with S3 full access
   - Save Access Key ID and Secret Access Key
   - Use these in your `.env.local`

### Step 4: Enable Production Code

In `/src/components/image-upload-manager.tsx`:

```typescript
// 1. Add import at top:
import { uploadToS3 as uploadFileToS3 } from '@/src/services/s3-upload';

// 2. Replace the uploadToS3 function with:
const uploadToS3 = async (file: File): Promise<UploadedImage> => {
  const result = await uploadFileToS3(file, 'questions');
  
  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }
  
  return {
    id: generateShortId(),
    url: result.url!,
    shortUrl: result.shortUrl!,
    fileName: file.name,
    size: file.size,
    uploadedAt: new Date()
  };
};
```

In `/src/services/s3-upload.ts`:
- Uncomment the production implementation code
- Comment out the mock implementation

### Step 5: (Optional) Setup CloudFront CDN

For better performance and security:

1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Update S3 URLs to use CloudFront domain
4. Enable HTTPS

## 🔗 URL Shortener Integration

### Option 1: Bit.ly Integration

```bash
npm install bitly
```

```typescript
import { BitlyClient } from 'bitly';

const bitly = new BitlyClient(process.env.BITLY_ACCESS_TOKEN!);

async function shortenUrl(longUrl: string): Promise<string> {
  const result = await bitly.shorten(longUrl);
  return result.link;
}
```

### Option 2: Custom Short URLs

Create a database table:
```sql
CREATE TABLE short_urls (
  id VARCHAR(10) PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INT DEFAULT 0
);
```

## 💡 Usage Examples

### In Question Editor:

1. **Click "Image Upload Manager (S3)" button** to expand
2. **Upload your image** (diagrams, charts, photos)
3. **Customize** width, height, position, and alt text
4. **Click "Insert into Editor"** - markdown is automatically added to question

### Manual Markdown Entry:

You can also type markdown directly:

```markdown
The diagram below shows the process:

![Process Flow](https://s3.exam.io/xyz789){width=600px position=center}

As shown on the right ![Small Icon](url){width=100px position=right}, the system...
```

### For Physics/Chemistry Diagrams:

```markdown
Consider the circuit diagram: 

![RC Circuit](https://s3.exam.io/circuit123){width=400px position=center}

The capacitor charges according to the equation $Q = Q_0(1 - e^{-t/RC})$
```

### For Multiple Images:

```markdown
![Left Image](url1){width=45% position=left}
![Right Image](url2){width=45% position=right}

Text flows between the two images naturally.
```

## 🎨 Styling

Images automatically get:
- Rounded corners (8px)
- Border and shadow
- Responsive sizing
- Smooth loading
- Error handling

Custom CSS classes added:
- `.content-image` - Base image style
- `.float-left` - Left-aligned with text wrap
- `.float-right` - Right-aligned with text wrap
- `.mx-auto` - Centered

## 🔒 Security Best Practices

1. **File Validation:**
   - Only allow image types (JPEG, PNG, GIF, WebP)
   - Max file size: 5MB
   - Validate on both client and server

2. **S3 Security:**
   - Use IAM roles instead of hardcoded keys in production
   - Implement bucket versioning
   - Enable server-side encryption
   - Set up lifecycle policies to auto-delete old files

3. **URL Security:**
   - Use signed URLs for private content
   - Implement rate limiting on uploads
   - Validate URLs before rendering

## 📊 File Organization

Uploaded images are organized in S3:
```
your-bucket/
  questions/
    2024-11-15-abc123.jpg
    2024-11-15-xyz789.png
  diagrams/
    ...
  solutions/
    ...
```

## 🐛 Troubleshooting

### Images not uploading:
- Check AWS credentials in `.env.local`
- Verify S3 bucket permissions
- Check CORS configuration
- Look at browser console for errors

### Images not displaying:
- Verify the URL is publicly accessible
- Check markdown syntax
- Ensure image file exists in S3

### Shortened URLs not working:
- Check URL shortener service credentials
- Verify API rate limits not exceeded
- Test with direct S3 URLs first

## 📝 Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| Upload | Mock (base64) | AWS S3 |
| URLs | Local data URLs | S3 HTTPS URLs |
| Short URLs | Mock generated | Bit.ly / Custom |
| CDN | None | CloudFront |
| Security | Relaxed | IAM roles, encrypted |

## 🚦 Next Steps

1. ✅ Test image upload locally
2. ✅ Set up AWS S3 bucket
3. ✅ Configure environment variables
4. ✅ Enable production code
5. ✅ Test in staging environment
6. ✅ Set up CloudFront (optional)
7. ✅ Configure URL shortener
8. ✅ Deploy to production

---

## Example Questions with Images

### Physics Question:
```markdown
**Question:** Analyze the circuit shown below:

![RC Circuit Diagram](https://s3.exam.io/physics/rc-circuit){width=500px position=center}

Calculate the time constant $\tau = RC$ where:
- $R = 1000\Omega$
- $C = 100\mu F$

**Solution:**
$\tau = RC = 1000 \times 100 \times 10^{-6} = 0.1s$
```

### Chemistry Question:
```markdown
**Question:** Identify the functional groups in the compound:

![Organic Molecule Structure](https://s3.exam.io/chem/molecule-abc){width=300px position=left}

The molecule shown contains:
- A) Aldehyde and alcohol
- B) Ketone and ester
- C) Carboxylic acid and amine
- D) Ether and alkene
```

---

For more help, check the inline code comments in:
- `/src/components/image-upload-manager.tsx`
- `/src/services/s3-upload.ts`
- `/src/components/ui/rich-content-editor.tsx`
