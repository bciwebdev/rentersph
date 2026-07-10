'use client';

import { useTransition } from 'react';
import { deletePropertyAction } from '../actions';

interface DeleteFormProps {
  propertyId: string;
}

export default function DeleteForm({ propertyId }: DeleteFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this listing?')) return;

    startTransition(async () => {
      const result = await deletePropertyAction(propertyId);
      if (result && !result.success) {
        alert(result.error || 'Failed to delete property listing.');
      }
    });
  };

  return (
    <form onSubmit={handleDelete} className="inline-block">
      <button
        type="submit"
        disabled={isPending}
        className={`text-red-600 hover:text-red-800 font-semibold text-sm transition-colors disabled:opacity-50`}
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>
    </form>
  );
}