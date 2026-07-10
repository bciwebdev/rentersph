// app/landlord/components/ImageUploader.tsx
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface ImageUploaderProps {
  defaultValue?: string;
  disabled?: boolean;
}

export default function ImageUploader({ defaultValue = '', disabled = false }: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(defaultValue);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instantiate the client-side Supabase instance
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // File Validation: Limit to 5MB images
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum allowed size is 5MB.');
      return;
    }

    try {
      setUploading(true);

      // Unique file path generation to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // Upload file directly to Supabase storage bucket
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Extract the public URL to save to our table later
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during image upload.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    if (!uploading && !disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Property Cover Image
      </label>

      {/* Hidden native input parsed by the Form shell */}
      <input type="hidden" name="cover_image" value={imageUrl} />

      {/* Hidden file selector trigger */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={uploading || disabled}
      />

      <div
        onClick={triggerFileSelect}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer min-h-[200px] bg-gray-50
          ${imageUrl ? 'border-gray-200 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}
        `}
      >
        {imageUrl ? (
          <div className="w-full text-center space-y-4">
            <img
              src={imageUrl}
              alt="Uploaded cover preview"
              className="mx-auto max-h-48 rounded-lg object-cover shadow-sm border border-gray-100"
            />
            <p className="text-xs text-gray-500 hover:text-blue-600 font-medium">
              Click anywhere to replace image
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600 hover:text-blue-500">
                Click to upload a cover photo
              </span>
            </div>
            <p className="text-xs text-gray-400">PNG, JPG, or WebP up to 5MB</p>
          </div>
        )}

        {/* Inner Spinner Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 rounded-xl space-y-2">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Uploading to RentersPH storage...</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}