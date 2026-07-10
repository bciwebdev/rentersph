'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase-server'; 

export async function updatePropertyAction(
  id: string, 
  prevState: any, 
  formData: FormData
) {
  try {
    const supabase = await createClient();

    // Extract values safely from FormData
    const title = formData.get('title') as string;
    const property_type = formData.get('property_type') as string;
    const price = parseFloat(formData.get('price') as string) || 0;
    const bedrooms = parseInt(formData.get('bedrooms') as string) || 0;
    const bathrooms = parseInt(formData.get('bathrooms') as string) || 0;
    const area = parseFloat(formData.get('area') as string) || 0;
    const address = formData.get('address') as string;
    const latitude = parseFloat(formData.get('latitude') as string) || 0;
    const longitude = parseFloat(formData.get('longitude') as string) || 0;
    const contact_number = formData.get('contact_number') as string;
    const email = formData.get('email') as string;
    const description = formData.get('description') as string;

    const { error } = await supabase
      .from('properties')
      .update({
        title,
        property_type,
        price,
        bedrooms,
        bathrooms,
        area,
        address,
        latitude,
        longitude,
        contact_number,
        email,
        description
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/landlord');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Update Error:', error);
    return { success: false, error: error.message || 'Failed to update property.' };
  }
}

export async function createProperty(prevState: any, formData: FormData) {
  return { success: false, error: 'Not implemented' };
}