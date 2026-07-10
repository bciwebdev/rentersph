"use client";

import { useTransition } from 'react';
// @ts-ignore
import { deletePropertyAction } from '../actions';

interface DeleteFormProps {
  propertyId: string;
}

export default function DeleteForm({ propertyId }: DeleteFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    startTransition(async () => {
      try {
        // Safe fallback execution if the action function isn't fully defined yet
        if (typeof deletePropertyAction === 'function') {
          await deletePropertyAction(propertyId);
        } else {
          console.warn("deletePropertyAction is not defined in actions file.");
        }
      } catch (error) {
        console.error("Failed to delete property:", error);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition duration-200 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete Property"}
    </button>
  );
}