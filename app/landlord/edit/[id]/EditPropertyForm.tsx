'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Adjusting the relative path to precisely point up 2 levels to actions.ts
import { updatePropertyAction } from '../../actions';

interface EditFormProps {
  property: any;
}

export default function EditPropertyForm({ property }: EditFormProps) {
  const router = useRouter();
  
  // Bind the property ID directly into the action context signature
  const updateActionWithId = updatePropertyAction.bind(null, property.id);
  const [state, formAction, isPending] = useActionState(updateActionWithId, null);

  // Safely trigger routing side effects in useEffect to avoid rendering updates
  useEffect(() => {
    if (state?.success) {
      router.push('/landlord');
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4 text-sm text-gray-700">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl font-medium border border-red-100 mb-4">
          ⚠️ {state.error}
        </div>
      )}

      {/* Hidden inputs to keep hold of necessary values */}
      <input type="hidden" name="existing_cover_image" value={property.cover_image || ''} />

      <div>
        <label className="block font-bold text-gray-700 mb-1">Listing Title</label>
        <input defaultValue={property.title} type="text" name="title" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Property Type</label>
          <select defaultValue={property.property_type} name="property_type" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50">
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="House">House</option>
            <option value="Room">Room/Studio</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Price / mo (₱)</label>
          <input defaultValue={property.price} type="number" name="price" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Beds</label>
          <input defaultValue={property.bedrooms} type="number" name="bedrooms" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Baths</label>
          <input defaultValue={property.bathrooms} type="number" name="bathrooms" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Area (sqm)</label>
          <input defaultValue={property.area} type="number" step="any" name="area" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-700 mb-1">Complete Address</label>
        <input defaultValue={property.address} type="text" name="address" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Latitude</label>
          <input defaultValue={property.latitude} type="number" step="any" name="latitude" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Longitude</label>
          <input defaultValue={property.longitude} type="number" step="any" name="longitude" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Contact Number</label>
          <input defaultValue={property.contact_number} type="text" name="contact_number" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Email</label>
          <input defaultValue={property.email} type="email" name="email" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-700 mb-1">Description</label>
        <textarea defaultValue={property.description || ''} name="description" rows={4} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50 resize-none" />
      </div>

      <div>
        <label className="block font-bold text-gray-700 mb-1">Replace Cover Image (Optional)</label>
        <input type="file" name="cover_image" accept="image/*" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 mt-4"
      >
        {isPending ? 'Saving changes...' : 'Update Listing'}
      </button>
    </form>
  );
}