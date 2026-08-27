/**
 * Client-side Image Optimization Utility for MM Dairy Farm
 * Resizes, compresses, and converts uploaded images to efficient WebP format
 * in the browser before sending them to Supabase Storage.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1, default 0.82
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Optimizes an uploaded File object or Blob.
 * Returns a new compressed File object in WebP format.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    format = 'image/webp'
  } = options;

  // If file is already small (e.g. < 50KB) and is webp, return as is
  if (file.size < 50 * 1024 && file.type === 'image/webp') {
    return file;
  }

  // SVG images do not need raster compression
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        try {
          // Calculate target dimensions preserving aspect ratio
          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          // Create canvas for high quality scaling
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Fallback if 2d context unavailable
            return;
          }

          // Enable high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Determine target file extension and type
          const targetFormat = format;
          const extension = targetFormat === 'image/webp' ? '.webp' : targetFormat === 'image/jpeg' ? '.jpg' : '.png';
          
          // Replace extension in filename
          const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const newFileName = `${originalName}${extension}`;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file); // Fallback to original if blob creation fails
                return;
              }

              // Create new optimized File object
              const optimizedFile = new File([blob], newFileName, {
                type: targetFormat,
                lastModified: Date.now()
              });

              // Log compression summary for debugging
              console.log(
                `[ImageOptimizer] ${file.name} (${(file.size / 1024).toFixed(1)} KB) → ${newFileName} (${(optimizedFile.size / 1024).toFixed(1)} KB) [${Math.round((1 - optimizedFile.size / file.size) * 100)}% saved]`
              );

              resolve(optimizedFile);
            },
            targetFormat,
            quality
          );
        } catch (err) {
          console.warn('[ImageOptimizer] Failed to optimize image, falling back to original file:', err);
          resolve(file);
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
