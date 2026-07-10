import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import EditPropertyForm from './EditPropertyForm';

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch target record confirming user owns it
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!property) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Edit Your Listing</h1>
        <p className="text-sm text-gray-400 mb-6">Modify the fields below to update your rental unit information instantly.</p>
        
        <EditPropertyForm property={property} />
      </div>
    </div>
  );
}