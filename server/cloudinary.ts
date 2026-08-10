import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary SDK from environment variables
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );
}

/**
 * Uploads an image (URL, base64 data URI, or buffer) to Cloudinary.
 * If Cloudinary credentials are set, uploads and returns the secure Cloudinary CDN URL.
 * Otherwise, gracefully returns the original input string.
 */
export async function uploadToCloudinary(imageInput: string, folder = 'royal_academy'): Promise<string> {
  if (!imageInput || typeof imageInput !== 'string') {
    return imageInput;
  }

  // If image is already hosted on Cloudinary, return as is
  if (imageInput.includes('res.cloudinary.com')) {
    return imageInput;
  }

  if (!isCloudinaryConfigured()) {
    console.warn('[Cloudinary] Env credentials missing. Storing image reference directly.');
    return imageInput;
  }

  try {
    const result = await cloudinary.uploader.upload(imageInput, {
      folder,
      resource_type: 'auto',
    });
    console.log(`[Cloudinary] Image uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    return imageInput;
  }
}
