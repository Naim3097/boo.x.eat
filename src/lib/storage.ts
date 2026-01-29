// =============================================
// SUPABASE STORAGE UTILITIES
// Image upload/download for boo.x.eat
// =============================================

import { supabase } from './supabase';

// Storage bucket names
export const BUCKETS = {
  LOGOS: 'logos',
  MENU_IMAGES: 'menu-images',
  PACKAGE_IMAGES: 'package-images',
  GALLERY: 'gallery',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// File upload options
export interface UploadOptions {
  bucket: BucketName;
  vendorId: string;
  file: File;
  folder?: string;
  fileName?: string;
}

// Generate unique file name
export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${timestamp}-${randomString}.${extension}`;
};

// Validate file type
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
};

// Validate file size (max 5MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Upload file to Supabase Storage
export const uploadImage = async ({
  bucket,
  vendorId,
  file,
  folder = '',
  fileName,
}: UploadOptions): Promise<{ url: string; path: string } | { error: string }> => {
  // Validate file
  if (!isValidImageType(file)) {
    return { error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF.' };
  }

  if (!isValidFileSize(file)) {
    return { error: 'File too large. Maximum size is 5MB.' };
  }

  // Generate file path
  const name = fileName || generateFileName(file.name);
  const path = folder ? `${vendorId}/${folder}/${name}` : `${vendorId}/${name}`;

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Upload exception:', err);
    return { error: 'Failed to upload image. Please try again.' };
  }
};

// Delete file from Supabase Storage
export const deleteImage = async (
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Delete exception:', err);
    return { success: false, error: 'Failed to delete image.' };
  }
};

// Upload multiple files
export const uploadMultipleImages = async (
  bucket: BucketName,
  vendorId: string,
  files: File[],
  folder?: string
): Promise<{ urls: string[]; errors: string[] }> => {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadImage({ bucket, vendorId, file, folder });
    
    if ('error' in result) {
      errors.push(`${file.name}: ${result.error}`);
    } else {
      urls.push(result.url);
    }
  }

  return { urls, errors };
};

// Get signed URL for private files (if needed)
export const getSignedUrl = async (
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string } | { error: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (err) {
    console.error('Signed URL exception:', err);
    return { error: 'Failed to generate signed URL.' };
  }
};

// Image compression helper (client-side)
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
  });
};
