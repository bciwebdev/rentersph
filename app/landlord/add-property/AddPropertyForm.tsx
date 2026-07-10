'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createProperty } from '../actions';
import MapPicker from './MapPicker';

interface ActionState {
  error?: string | null;
  success?: boolean;
}

export default function AddPropertyForm() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    createProperty,
    null
  );

  return (
    <form action={formAction} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">
          {state.error}
        </div>
      )}

      {/* Hidden Location Fields */}
      <input type="hidden" name="latitude" id="latitude" required />
      <input type="hidden" name="longitude" id="longitude" required />

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Primary Info</h3>
        <input name="title" placeholder="Property Title" required className="w-full p-3 border border-gray-300 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <input name="price" type="number" placeholder="Price (PHP)" required className="w-full p-3 border border-gray-300 rounded-xl" />
          <select name="property_type" className="w-full p-3 border border-gray-300 rounded-xl bg-white" required>
            <option value="Apartment">Apartment</option>
            <option value="Condominium">Condominium</option>
            <option value="House">House</option>
            <option value="Studio">Studio</option>
            <option value="Boarding House">Boarding House</option>
          </select>
        </div>
        <input name="address" placeholder="Full Address" required className="w-full p-3 border border-gray-300 rounded-xl" />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Specifications</h3>
        <div className="grid grid-cols-3 gap-4">
          <input name="bedrooms" type="number" placeholder="Bedrooms" required className="w-full p-3 border border-gray-300 rounded-xl" />
          <input name="bathrooms" type="number" placeholder="Bathrooms" required className="w-full p-3 border border-gray-300 rounded-xl" />
          <input name="area" type="number" placeholder="Area (sqm)" required className="w-full p-3 border border-gray-300 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select name="bathroom_type" className="w-full p-3 border border-gray-300 rounded-xl bg-white">
            <option value="Private">Private Bathroom</option>
            <option value="Common">Common Bathroom</option>
          </select>
          <select name="restroom_type" className="w-full p-3 border border-gray-300 rounded-xl bg-white">
            <option value="Private">Private Restroom</option>
            <option value="Common">Common Restroom</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Location</h3>
        <label className="block text-xs font-bold text-gray-700 uppercase">Pin Property Location on Map</label>
        <MapPicker />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Contact & Media</h3>
        <input name="contact_number" placeholder="Mobile Number" required className="w-full p-3 border border-gray-300 rounded-xl" />
        <input name="email" type="email" placeholder="Email" required className="w-full p-3 border border-gray-300 rounded-xl" />
        <textarea name="description" placeholder="Narrative Description" rows={3} className="w-full p-3 border border-gray-300 rounded-xl"></textarea>
        <input name="cover_image" type="file" accept="image/*" required className="w-full p-3 border border-gray-300 rounded-xl" />
      </div>

      <button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
        {isPending ? 'Publishing...' : 'Publish Rental Listing'}
      </button>
    </form>
  );
}