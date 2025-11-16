# 🚀 Quick Start - Enhanced Bulk Upload

## ⚡ 3 Steps to Auto-Extract Questions from PDFs

### **Step 1: Install Packages**

```bash
# Install npm packages
npm install pdf-parse pdf2pic sharp

# Install GraphicsMagick (system dependency)
# macOS:
brew install graphicsmagick

# Ubuntu/Debian:
# sudo apt-get install graphicsmagick
```

### **Step 2: Add OpenAI API Key**

Add to `.env.local`:

```bash
# OpenAI API Key for GPT-4 Vision
OPENAI_API_KEY=sk-...your-api-key...
```

**Get API Key:** https://platform.openai.com/api-keys

### **Step 3: Restart & Test**

```bash
npm run dev
```

Go to: **http://localhost:3001/bulk-upload**

---

## ✨ What It Does

1. **Extracts images** from each PDF page
2. **Uploads to S3** automatically
3. **Uses GPT-4 Vision** to read questions
4. **Formats LaTeX** equations perfectly
5. **Saves as drafts** (no correct answers marked)

---

## 📊 Example

### **Upload:**
- 10-page JEE Main PDF

### **Result:**
- 30 questions extracted
- All equations in LaTeX
- Diagrams embedded
- Options A, B, C, D extracted
- Saved as drafts for review

### **Time:**
- ~60-90 seconds

### **Cost:**
- ~$0.08 per PDF

---

## ✅ Success Indicators

✅ Console shows: "📸 Converting page X/Y..."  
✅ Console shows: "📤 Uploading image X/Y to S3..."  
✅ Console shows: "🤖 Processing with GPT-4 Vision..."  
✅ Questions appear in draft mode  
✅ LaTeX equations render correctly  
✅ Images embedded in questions  

---

## 🎯 Next Steps

1. Upload a test PDF
2. Review extracted questions
3. Mark correct answers
4. Publish questions

**Full docs:** See `BULK_UPLOAD_ENHANCED_SETUP.md`
