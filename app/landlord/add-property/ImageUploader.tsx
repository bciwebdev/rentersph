// app/landlord/add-property/ImageUploader.tsx
'use client';

import React, { useState, useRef } from 'react';

export default function ImageUploader() {
  const [images, setImages] = useState<{ url: string; file: File; uploadedUrl?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadError(null);

    const selectedFiles = Array.from(e.target.files);
    
    // Enforce strict limit of 10 photos max
    if (images.length + selectedFiles.length > 10) {
      setUploadError('You can only upload a maximum of 10 photos.');
      return;
    }

    setUploading(true);

    const newImages = [...images];

    for (const file of selectedFiles) {
      // Create local object URL for instant phone screen preview
      const localUrl = URL.createObjectURL(file);
      const imageIndex = newImages.length;
      newImages.push({ url: localUrl, file });
      setImages([...newImages]);

      try {
        // Generate clean file paths to prevent name collision overrides
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        
        // Target your Supabase project bucket storage API endpoints natively
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const bucketName = 'property-images'; // Ensure this bucket exists in your Supabase storage tab!

        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'API-KEY': supabaseKey || '',
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!response.ok) throw new Error('Failed uploading image asset to storage bucket');

        const data = await response.json();
        // Construct standard readable public URL path route
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
        
        newImages[imageIndex].uploadedUrl = publicUrl;
        setImages([...newImages]);
      } catch (err: any) {
        setUploadError('Failed to upload one or more images. Check storage bucket permissions.');
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    const filtered = images.filter((_, idx) => idx !== indexToRemove);
    // Revoke memory allocations to avoid storage leaks on mobile
    URL.revokeObjectURL(images[indexToRemove].url);
    setImages(filtered);
  };

  // Extract URLs to pass down cleanly to your main form submission handler
  const uploadedUrls = images.map(img => img.uploadedUrl).filter(Boolean) as string[];
  const coverImage = uploadedUrls[0] || '';
  const allImagesJson = JSON.stringify(uploadedUrls);

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
        Upload Gallery Photos (Max 10)
      </label>

      {/* Hidden inputs to feed the form values upstream safely into server actions */}
      <input type="hidden" name="cover_image" value={coverImage} />
      <input type="hidden" name="additional_images" value={allImagesJson} />

      {/* Trigger File Box interface built for comfortable thumb taps on phones */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[140px]"
      >
        <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-bold text-blue-600">Tap to upload images</span>
        <span className="text-xs text-gray-400 mt-1">Supports PNG, JPG up to 10 files</span>
        
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Loading indicator line wrapper */}
      {uploading && (
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
          <svg className="animate-spin h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Uploading photos from phone...</span>
        </div>
      )}

      {/* Error warning bar */}
      {uploadError && (
        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
          {uploadError}
        </div>
      )}

      {/* Dynamic Grid Previews Layout Layer */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-2xs group bg-gray-100">
              <img src={img.url} alt="Listing Preview" className="w-full h-full object-cover" />
              
              {/* Badge to highlight what the primary main card thumbnail is */}
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-blue-600 text-[9px] text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Cover
                </span>
              )}

              {/* Status overlay layer pending async confirmation */}
              {!img.uploadedUrl && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Floating Delete Anchor Node */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors outline-none"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}