// ── Client-side image compression ────────────────────────────
// Resizes images to max 1600px on longest side, JPEG 80% quality.
// Skips GIFs (preserve animation) and already-small images.

export async function compressImage(file, { maxDimension = 1600, quality = 0.8 } = {}) {
  // Skip GIFs — don't re-encode animated images
  if (file.type === 'image/gif') return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Already small enough — pass through unchanged
      if (width <= maxDimension && height <= maxDimension && file.size < 500_000) {
        resolve(file);
        return;
      }

      // Calculate scaled dimensions
      const scale = Math.min(maxDimension / width, maxDimension / height, 1);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.\w+$/, '.jpg'),
            { type: 'image/jpeg' }
          );
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
