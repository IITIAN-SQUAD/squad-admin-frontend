# Environment Configuration Guide

## Image Cache Configuration

Add these variables to your `.env.local` file to configure the image caching system:

```bash
# Image Cache Settings
NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=100
NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=1
```

---

## Configuration Options

### **NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB**
- **Description**: Maximum cache size in megabytes
- **Default**: 100 (MB)
- **Recommended Values**:
  - Light usage: 50-100 MB
  - Medium usage: 100-200 MB
  - Heavy usage: 200-500 MB
- **Example**: `NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=200`

### **NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS**
- **Description**: Time-to-live for cached images in hours
- **Default**: 1 (hour)
- **Recommended Values**:
  - Frequently changing content: 0.5-1 hours
  - Stable content: 2-4 hours
  - Static content: 6-24 hours
- **Example**: `NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=2`

---

## Complete .env.local Example

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=prod-image-bucket-2

# Image Cache Configuration
NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=150
NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=2
```

---

## Cost Savings Calculator

### Without Caching:
- 100 questions with 3 images each = 300 images
- User edits for 30 minutes, views each question 5 times
- Total S3 GET requests: **1,500**
- Cost: 1,500 × $0.0004 = **$0.60**

### With Caching (1 hour TTL):
- First load: 300 S3 GET requests
- Subsequent loads: 0 S3 GET requests (cached)
- Total S3 GET requests: **300**
- Cost: 300 × $0.0004 = **$0.12**
- **Savings: $0.48 (80%)**

### With Caching (2 hour TTL):
- Even better savings for longer editing sessions
- **Savings: 85-90%**

---

## Recommended Settings by Use Case

### **Development Environment**
```bash
NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=50
NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=0.5
```
- Smaller cache for faster testing
- Shorter TTL to see changes quickly

### **Production Environment (Light Traffic)**
```bash
NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=100
NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=2
```
- Balanced performance and memory usage

### **Production Environment (Heavy Traffic)**
```bash
NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=200
NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=4
```
- Larger cache for more users
- Longer TTL for maximum savings

### **Question Editor (Recommended)**
```bash
NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=150
NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS=2
```
- Optimal for editing sessions
- Good balance of performance and memory

---

## How to Apply Changes

1. **Edit `.env.local`** file in your project root
2. **Add or update** the cache configuration variables
3. **Restart dev server**: `npm run dev`
4. **Verify** in browser console: Look for `[Image Cache] Initialized with...`

---

## Monitoring Cache Performance

### Check Console Logs:
```
[Image Cache] Initialized with 150MB cache, 2h TTL
[Cache MISS] https://...image1.png
[Cache HIT] https://...image1.png
[Cache HIT] https://...image1.png
```

### Use Cache Monitor Component:
- Add `<CacheMonitor />` to your layout
- View real-time statistics
- Monitor hit rate and cache size

---

## Troubleshooting

### Cache not working?
1. Check `.env.local` has `NEXT_PUBLIC_` prefix
2. Restart dev server after changing env vars
3. Check browser console for initialization message

### Cache too small?
- Increase `NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB`
- Monitor "Cache size" in Cache Monitor

### Images not caching?
- Only S3 URLs are cached (contains `s3.amazonaws.com` or `.s3.`)
- Check browser console for cache logs

### Memory issues?
- Reduce `NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB`
- Reduce `NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS`

---

## Performance Metrics

With proper configuration, you should see:
- **95%+ cache hit rate** after initial page load
- **0ms load time** for cached images
- **80-90% reduction** in S3 GET requests
- **Instant preview updates** in question editor

---

## Notes

- Cache is per-browser-tab (not shared across tabs)
- Cache clears on page refresh
- Only S3 images are cached
- Cache size is monitored automatically
- Old entries are evicted when cache is full (LRU)
- Expired entries are cleaned up every 5 minutes
