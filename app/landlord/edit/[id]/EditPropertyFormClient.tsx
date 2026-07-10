'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePropertyAction } from '../../actions';

interface EditFormProps {
  property: any;
}

export default function EditPropertyFormClient({ property }: EditFormProps) {
  const router = useRouter();
  const updateActionWithId = updatePropertyAction.bind(null, property.id);
  const [state, formAction, isPending] = useActionState(updateActionWithId, null);

  useEffect(() => {
    if (state?.success) {
      router.push('/landlord');
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-4 text-sm text-gray-700">
      {state?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl font-medium border border-red-100 mb-4">
          ⚠️ {state.error}
        </div>
      )}
      
      <div>
        <label className="block font-bold text-gray-700 mb-1">Listing Title</label>
        <input defaultValue={property.title} type="text" name="title" required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50/50" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 mt-4"
      >
        {isPending ? 'Saving...' : 'Update Listing'}
      </button>
    </form>
  );
}