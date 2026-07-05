'use client';
import { useState } from 'react';

export default function AddDebtForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    principal: '',
    apr: '',
    minimum_payment: '',
    type: 'credit_card'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          principal: parseFloat(formData.principal),
          apr: parseFloat(formData.apr),
          minimum_payment: parseFloat(formData.minimum_payment),
        })
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert('Failed to add debt: ' + (err.error || JSON.stringify(err.details)));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Debt</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
            <input required type="text" className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Chase Sapphire" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal ($)</label>
              <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={formData.principal} onChange={e => setFormData({...formData, principal: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">APR (%)</label>
              <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={formData.apr} onChange={e => setFormData({...formData, apr: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Payment ($)</label>
              <input required type="number" step="0.01" min="0" className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={formData.minimum_payment} onChange={e => setFormData({...formData, minimum_payment: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="credit_card">Credit Card</option>
                <option value="personal_loan">Personal Loan</option>
                <option value="student_loan">Student Loan</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-md transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50">Save Debt</button>
          </div>
        </form>
      </div>
    </div>
  );
}
