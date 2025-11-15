# 🧪 Cache Testing Guide

## How to Verify Cache is Working

---

## ✅ **Method 1: Browser Console (Recommended)**

### **Step 1: Open Console**
- Press **F12** or **Right-click → Inspect**
- Go to **Console** tab

### **Step 2: Load a Page with S3 Images**
- Navigate to question editor
- Or go to: http://localhost:3001/test-cache

### **Step 3: Look for Cache Logs**

**First time loading an image:**
```
[Cache MISS] https://prod-image-bucket-2.s3.ap-south-1.amazonaws.com/questions/image.png
```

**Second time loading the same image:**
```
[Cache HIT] https://prod-image-bucket-2.s3.ap-south-1.amazonaws.com/questions/image.png
```

**✅ If you see "Cache HIT" → Cache is working!**

---

## 🔍 **Method 2: Network Tab**

### **Step 1: Open Network Tab**
- Press **F12** → **Network** tab
- Filter by **"Img"** to see only images

### **Step 2: Load Images**
- Load a question with S3 images
- Note the S3 requests

### **Step 3: Reload or Navigate Back**
- Reload the page or navigate away and back

### **Result:**
- **Without Cache**: S3 requests appear every time
- **With Cache**: S3 requests only on first load

---

## 📊 **Method 3: Test Page (Best for Beginners)**

### **Navigate to:**
```
http://localhost:3001/test-cache
```

### **Test Steps:**

1. **Click "Load Image" button** multiple times
2. **Watch the stats cards:**
   - **Cache Hits**: Increases on 2nd+ clicks
   - **Cache Misses**: Only increases on 1st click
   - **Hit Rate**: Should be > 0% after 2nd click

3. **Go to "Cache Inspector" tab:**
   - See all cached images
   - View cache keys (URLs)
   - Check timestamps and sizes

---

## 🔑 **Cache Key Structure**

### **What is the Cache Key?**

The cache key is the **full S3 URL**:

```
https://prod-image-bucket-2.s3.ap-south-1.amazonaws.com/questions/screenshot_2025_11_16_at_2_51_21_am_1763241693677_m7hp0y.png
```

### **Cache Entry Structure:**

```javascript
// Key (used for lookup)
"https://prod-image-bucket-2.s3.ap-south-1.amazonaws.com/questions/image.png"

// Value (stored data)
{
  blob: Blob,                    // The actual image data
  url: "blob:http://localhost:3001/abc-123",  // Object URL for display
  timestamp: 1700098234567,      // When cached (milliseconds)
  size: 524288                   // Size in bytes
}
```

### **Why Full URL as Key?**

✅ **Unique**: Each S3 URL is unique  
✅ **Simple**: No parsing or hashing needed  
✅ **Fast**: O(1) Map lookup  
✅ **Reliable**: No key collisions  

---

## 💻 **Method 4: Programmatic Testing**

### **In Browser Console:**

```javascript
// Import cache service
const { imageCacheService } = await import('/src/services/image-cache.service');

// Your S3 image URL
const testUrl = 'https://prod-image-bucket-2.s3.ap-south-1.amazonaws.com/questions/image.png';

// Check if cached
console.log('Is cached?', imageCacheService.has(testUrl));

// Get cache stats
const stats = imageCacheService.getStats();
console.log('Cache stats:', {
  hits: stats.hits,
  misses: stats.misses,
  hitRate: stats.hitRate.toFixed(1) + '%',
  entries: stats.entries,
  sizeMB: stats.sizeMB.toFixed(2) + ' MB'
});
```

### **In Your Component:**

```tsx
import { imageCacheService } from '@/src/services/image-cache.service';
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    // Check specific image
    const imageUrl = 'https://...your-s3-url...';
    const isCached = imageCacheService.has(imageUrl);
    console.log('Image cached?', isCached);
    
    // Get all stats
    const stats = imageCacheService.getStats();
    console.log('Cache stats:', stats);
  }, []);
  
  return <div>...</div>;
}
```

---

## 🎯 **Complete Testing Checklist**

### **1. Initial Setup**
- [ ] Added env vars to `.env.local`
- [ ] Restarted dev server
- [ ] Saw initialization log: `[Image Cache] Initialized with...`

### **2. Basic Functionality**
- [ ] Loaded page with S3 images
- [ ] Saw `[Cache MISS]` on first load
- [ ] Saw `[Cache HIT]` on second load
- [ ] Images display correctly

### **3. Test Page Verification**
- [ ] Navigated to `/test-cache`
- [ ] Clicked "Load Image" multiple times
- [ ] Cache Hits counter increased
- [ ] Hit Rate > 0%

### **4. Cache Inspector**
- [ ] Opened "Cache Inspector" tab
- [ ] Saw cached images listed
- [ ] Verified cache keys are full URLs
- [ ] Checked timestamps and sizes

### **5. Network Verification**
- [ ] Opened Network tab
- [ ] Filtered by images
- [ ] First load: S3 requests visible
- [ ] Second load: No S3 requests (cached)

### **6. Performance Check**
- [ ] Images load instantly after first fetch
- [ ] No loading delays on preview updates
- [ ] Smooth scrolling in question lists

---

## 📈 **Expected Results**

### **Console Output:**
```
[Image Cache] Initialized with 150MB cache, 2h TTL
[Cache MISS] https://...image1.png
[Cache MISS] https://...image2.png
[Cache MISS] https://...image3.png
[Cache HIT] https://...image1.png
[Cache HIT] https://...image2.png
[Cache HIT] https://...image1.png
```

### **Cache Stats:**
```javascript
{
  hits: 15,
  misses: 3,
  hitRate: 83.33,      // 83.33% hit rate
  entries: 3,          // 3 images cached
  sizeMB: 1.5,         // 1.5 MB cache size
  totalSize: 1572864   // bytes
}
```

### **Network Tab:**
- **First Load**: 3 S3 requests (200ms each)
- **Second Load**: 0 S3 requests (instant)

---

## 🔧 **Debugging Cache Issues**

### **Cache Not Working?**

1. **Check initialization:**
   ```
   Look for: [Image Cache] Initialized with...
   If missing: Check env vars and restart server
   ```

2. **Check URL format:**
   ```javascript
   // Only S3 URLs are cached
   ✅ https://bucket.s3.amazonaws.com/...
   ✅ https://bucket.s3.region.amazonaws.com/...
   ❌ https://example.com/image.png (not S3)
   ```

3. **Check console for errors:**
   ```
   Look for: Failed to cache image: ...
   ```

### **No Cache HIT Logs?**

1. **Clear cache and retry:**
   ```javascript
   imageCacheService.clear();
   ```

2. **Check if URL is exactly the same:**
   ```javascript
   // URLs must match exactly (case-sensitive)
   ✅ https://bucket.s3.amazonaws.com/image.png
   ❌ https://bucket.s3.amazonaws.com/Image.png (different)
   ```

### **Cache Too Small?**

1. **Check cache size:**
   ```javascript
   const stats = imageCacheService.getStats();
   console.log('Cache size:', stats.sizeMB, 'MB');
   ```

2. **Increase cache size in `.env.local`:**
   ```bash
   NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB=300
   ```

---

## 🎨 **Visual Verification**

### **Cache Monitor (Bottom-Right Corner):**

Shows real-time stats:
- Cache Hits: 15
- Cache Misses: 3
- Hit Rate: 83.3%
- Entries: 3
- Cache Size: 1.5 MB

### **Cache Inspector (Test Page):**

Shows all cached images:
- Image filename
- Full URL (cache key)
- Size in KB/MB
- Time since cached
- Copy URL button

---

## 💡 **Pro Tips**

### **1. Monitor in Real-Time:**
```javascript
// Log cache stats every 5 seconds
setInterval(() => {
  const stats = imageCacheService.getStats();
  console.log('Cache:', stats.hits, 'hits,', stats.misses, 'misses');
}, 5000);
```

### **2. Check Specific Image:**
```javascript
const imageUrl = 'https://...';
console.log('Cached?', imageCacheService.has(imageUrl));
```

### **3. List All Cached URLs:**
```javascript
// @ts-ignore
const urls = Array.from(imageCacheService.cache.keys());
console.log('Cached URLs:', urls);
```

### **4. Clear Cache for Testing:**
```javascript
imageCacheService.clear();
console.log('Cache cleared');
```

---

## ✅ **Success Indicators**

You know cache is working when:

✅ Console shows `[Cache HIT]` logs  
✅ Hit rate > 0% in Cache Monitor  
✅ Images load instantly after first fetch  
✅ No S3 requests in Network tab (after first load)  
✅ Cache Inspector shows cached images  
✅ Smooth preview updates with no delays  

---

## 🎉 **Summary**

### **Quick Verification:**

1. Open console (F12)
2. Load a question with images
3. Look for `[Cache MISS]` then `[Cache HIT]`
4. Check Cache Monitor stats

### **Cache Key:**

- **Key**: Full S3 URL
- **Value**: Blob + Object URL + metadata
- **Lookup**: O(1) constant time

### **Expected Performance:**

- **First load**: 200ms (fetches from S3)
- **Subsequent loads**: 0ms (instant from cache)
- **Hit rate**: 90%+ after initial load

---

**Your cache is working if you see Cache HIT logs! 🎉**
