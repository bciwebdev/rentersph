// app/landlord/add-property/page.tsx
import AddPropertyForm from './AddPropertyForm';

export default function AddPropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create New Listing</h1>
        <p className="text-gray-500 mb-8">Complete the details below to add your property to the marketplace.</p>
        
        <AddPropertyForm />
      </div>
    </div>
  );
}