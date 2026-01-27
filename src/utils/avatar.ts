/**
 * Avatar utilities for generating initials and colors
 */

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get avatar color based on name hash
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Generate avatar data URL with initials
 */
export function generateAvatarDataURL(name: string): string {
  const initials = getInitials(name);
  const color = getAvatarColor(name);
  
  // Map color classes to actual hex colors
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3B82F6',
    'bg-green-500': '#10B981',
    'bg-yellow-500': '#F59E0B',
    'bg-purple-500': '#8B5CF6',
    'bg-pink-500': '#EC4899',
    'bg-indigo-500': '#6366F1',
    'bg-red-500': '#EF4444',
    'bg-orange-500': '#F97316',
    'bg-teal-500': '#14B8A6',
    'bg-cyan-500': '#06B6D4',
  };
  
  const backgroundColor = colorMap[color] || '#6B7280';
  
  // Create SVG avatar
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${backgroundColor}"/>
      <text x="20" y="25" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">
        ${initials}
      </text>
    </svg>
  `;
  
  // Convert SVG to data URL
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}
