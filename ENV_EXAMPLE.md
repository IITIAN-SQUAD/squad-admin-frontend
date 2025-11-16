# Environment Variables for Bulk Upload

Create a `.env.local` file in the root directory with these variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=iitian-squad-questions

# Optional
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## How to Get These Keys:

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste into OPENAI_API_KEY

### AWS Credentials
1. Go to AWS IAM Console
2. Create a new user with S3 permissions
3. Generate access keys
4. Copy Access Key ID and Secret Access Key

### S3 Bucket
1. Create a new S3 bucket in AWS Console
2. Name it (e.g., "iitian-squad-questions")
3. Configure public access and CORS (see BULK_UPLOAD_SETUP.md)
