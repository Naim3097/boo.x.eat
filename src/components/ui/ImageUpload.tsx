// =============================================
// IMAGE UPLOAD COMPONENT
// Reusable image upload with preview
// =============================================

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { uploadImage, compressImage, isValidImageType, isValidFileSize } from '../../lib/storage';
import type { BucketName } from '../../lib/storage';

interface ImageUploadProps {
  bucket: BucketName;
  vendorId: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  className?: string;
  aspectRatio?: 'square' | '16:9' | '4:3' | 'auto';
  maxSizeMB?: number;
  compress?: boolean;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  bucket,
  vendorId,
  currentUrl,
  onUpload,
  onRemove,
  folder,
  className = '',
  aspectRatio = 'square',
  maxSizeMB = 5,
  compress = true,
  placeholder = 'Click or drag to upload image',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    auto: '',
  };

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Validate
    if (!isValidImageType(file)) {
      setError('Please upload JPEG, PNG, WebP, or GIF images only.');
      return;
    }

    if (!isValidFileSize(file, maxSizeMB)) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setIsUploading(true);

    try {
      // Compress if enabled
      const fileToUpload = compress ? await compressImage(file) : file;

      // Upload
      const result = await uploadImage({
        bucket,
        vendorId,
        file: fileToUpload,
        folder,
      });

      if ('error' in result) {
        setError(result.error);
        setPreview(currentUrl || null);
      } else {
        setPreview(result.url);
        onUpload(result.url);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      setPreview(currentUrl || null);
    } finally {
      setIsUploading(false);
    }
  }, [bucket, vendorId, folder, compress, maxSizeMB, currentUrl, onUpload]);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  // Handle click upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    onRemove?.();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      <motion.div
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer
          transition-colors duration-200
          ${aspectClasses[aspectRatio]}
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : preview
              ? 'border-transparent'
              : 'border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-gray-100'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
              <p className="text-sm text-dark-500">Uploading...</p>
            </motion.div>
          ) : preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full group"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-5 h-5 text-dark-700" />
                </button>
                {onRemove && (
                  <button
                    onClick={handleRemove}
                    className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-sm text-dark-600 text-center font-medium">
                {placeholder}
              </p>
              <p className="text-xs text-dark-400 mt-1 text-center">
                JPEG, PNG, WebP up to {maxSizeMB}MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-2 text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Multiple image upload (for galleries)
interface MultiImageUploadProps {
  bucket: BucketName;
  vendorId: string;
  currentUrls?: string[];
  onUpload: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  bucket,
  vendorId,
  currentUrls = [],
  onUpload,
  folder,
  maxImages = 10,
  className = '',
}) => {
  const [images, setImages] = useState<string[]>(currentUrls);

  const handleAddImage = (url: string) => {
    if (images.length < maxImages) {
      const newImages = [...images, url];
      setImages(newImages);
      onUpload(newImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onUpload(newImages);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Existing images */}
        {images.map((url, index) => (
          <div key={url} className="relative group aspect-square rounded-xl overflow-hidden">
            <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add new image */}
        {images.length < maxImages && (
          <ImageUpload
            bucket={bucket}
            vendorId={vendorId}
            folder={folder}
            onUpload={handleAddImage}
            placeholder="Add image"
            aspectRatio="square"
          />
        )}
      </div>

      <p className="text-sm text-dark-400">
        {images.length} / {maxImages} images
      </p>
    </div>
  );
};

export default ImageUpload;
