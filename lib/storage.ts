import { supabase } from "./supabase";

export async function uploadPropertyImages(
  propertyId: number,
  files: File[]
) {
  const uploadedImages: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `${propertyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    uploadedImages.push(data.publicUrl);
  }

  return uploadedImages;
}