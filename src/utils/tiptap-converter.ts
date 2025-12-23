/**
 * Converts plain text with LaTeX to TipTap JSON format
 */
export function textToTipTapJSON(text: string): string {
  // Simple conversion - creates a doc with paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim());
  
  const content = paragraphs.map(para => ({
    type: 'paragraph',
    content: [{
      type: 'text',
      text: para
    }]
  }));

  return JSON.stringify({
    type: 'doc',
    content: content.length > 0 ? content : [{
      type: 'paragraph',
      content: [{
        type: 'text',
        text: text
      }]
    }]
  });
}

/**
 * Converts text with LaTeX to HTML with proper equation spans
 */
export function textToHTML(text: string, images?: Array<{s3Url?: string}>): string {
  let html = text;
  
  // Convert inline LaTeX $...$ to spans
  html = html.replace(/\$([^\$]+)\$/g, '<span class="equation-inline" data-latex="$1">$1</span>');
  
  // Convert block LaTeX $$...$$ to divs
  html = html.replace(/\$\$([^\$]+)\$\$/g, '<div class="equation-block" data-latex="$1">$1</div>');
  
  // Add images if provided
  if (images && images.length > 0) {
    images.forEach(img => {
      if (img.s3Url) {
        html += `<br><img src="${img.s3Url}" alt="Question image" style="max-width: 100%; height: auto;" />`;
      }
    });
  }
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<p>') && !html.startsWith('<div>')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}

/**
 * Strips HTML and LaTeX to get plain text
 */
export function toPlainText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\$\$?([^\$]+)\$\$?/g, '$1') // Remove LaTeX delimiters
    .trim();
}
