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
  try {
    const supabase = await createClient();

    // Mapping form data
    const newProperty = {
      title: formData.get('title'),
      property_type: formData.get('property_type'),
      price: parseFloat(formData.get('price') as string),
      bedrooms: parseInt(formData.get('bedrooms') as string),
      bathrooms: parseInt(formData.get('bathrooms') as string),
      area: parseFloat(formData.get('area') as string),
      address: formData.get('address'),
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
      contact_number: formData.get('contact_number'),
      email: formData.get('email'),
      description: formData.get('description'),
      status: 'unpaid' // Force status to unpaid
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(newProperty)
      .select()
      .single();

    if (error) throw error;

    return { success: true, propertyId: data.id, error: null };
  } catch (error: any) {
    console.error('Creation Error:', error);
    return { success: false, error: error.message || 'Failed to create property.' };
  }
}