/**
 * Utility to convert Google Drive sharing URLs into direct displayable image links,
 * and provide clean fallbacks.
 */
export function formatImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
  }

  const cleanUrl = url.trim();

  // Check if it is a Google Drive URL
  if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com')) {
    // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
    const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${fileDMatch[1]}&sz=w800`;
    }

    // Pattern 2: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
    const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
    }

    // Pattern 3: https://drive.google.com/uc?id=FILE_ID
    const ucMatch = cleanUrl.match(/\/uc\?.*?id=([a-zA-Z0-9_-]+)/);
    if (ucMatch && ucMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w800`;
    }
  }

  return cleanUrl;
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
