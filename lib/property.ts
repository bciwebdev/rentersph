import { supabase } from "./supabase";

type CreatePropertyParams = {
  title: string;
  propertyType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  address: string;
  description: string;
  contactNumber: string;
  email: string;
  coverImage?: string;
  userId: string;
};

export async function createProperty(property: CreatePropertyParams) {
  const { data, error } = await supabase
    .from("properties")
    .insert([
      {
        title: property.title,
        property_type: property.propertyType,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        address: property.address,
        description: property.description,
        contact_number: property.contactNumber,
        email: property.email,
        cover_image: property.coverImage ?? null,
        user_id: property.userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateCoverImage(
  propertyId: number,
  coverImage: string
) {
  const { error } = await supabase
    .from("properties")
    .update({
      cover_image: coverImage,
    })
    .eq("id", propertyId);

  if (error) throw error;
}

export async function savePropertyImages(
  propertyId: number,
  imageUrls: string[]
) {
  if (imageUrls.length === 0) return;

  const rows = imageUrls.map((url, index) => ({
    property_id: propertyId,
    image_url: url,
    image_order: index,
  }));

  const { error } = await supabase
    .from("property_images")
    .insert(rows);

  if (error) throw error;
}