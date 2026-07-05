'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddDebtForm from '@/components/AddDebtForm';

export default function Dashboard() {
  const router = useRouter();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch('/api/debts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setDebts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, isPaid: boolean = false) => {
    try {
      const token = localStorage.getItem('accessToken');
      let res;
      if (isPaid) {
        res = await fetch(`/api/debts/${id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ paid: true })
        });
      } else {
        res = await fetch(`/api/debts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      if (res.ok) {
        fetchDebts(); // Refresh list
      } else {
        alert('Failed to update debt');
      }
    } catch (e) {
      alert('Error updating debt');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-[80vh]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your debts and run payoff simulations.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition">
            Log Out
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm transition"
          >
            + Add Debt
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddDebtForm 
          onClose={() => setShowAddForm(false)} 
          onSuccess={() => {
            setShowAddForm(false);
            fetchDebts();
          }} 
        />
      )}
      
      {debts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-800">You're debt-free (on paper)!</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Add your first debt to start visualizing your path to financial freedom and run AI-powered simulations.</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm transition"
          >
            Add your first debt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Current Debts</h2>
              <div className="space-y-4">
                {debts.filter((d: any) => !d.paid_at).length === 0 && (
                  <p className="text-gray-500">No active debts. Add one to get started!</p>
                )}
                {debts.filter((d: any) => !d.paid_at).map((d: any) => (
                  <div key={d.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{d.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{d.type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-gray-900 text-lg">${Number(d.principal).toLocaleString()}</p>
                      <p className="text-sm text-gray-500 mb-2">{Number(d.apr)}% APR • Min: ${Number(d.minimum_payment)}/mo</p>
                      <div className="flex gap-2 sm:justify-end">
                        <button 
                          onClick={() => handleArchive(d.id, true)} 
                          className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md font-medium transition"
                        >
                          Mark Paid
                        </button>
                        <button 
                          onClick={() => confirm('Are you sure you want to delete this debt?') && handleArchive(d.id, false)} 
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {debts.filter((d: any) => d.paid_at).length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">Paid History</h2>
                  <div className="space-y-4 opacity-75">
                    {debts.filter((d: any) => d.paid_at).map((d: any) => (
                      <div key={d.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-green-100 rounded-xl bg-green-50/30 gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 text-md">{d.name} <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">PAID</span></h3>
                          <p className="text-sm text-gray-500 capitalize">{d.type.replace('_', ' ')}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-gray-700 text-md">${Number(d.principal).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{new Date(d.paid_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white">
              <h2 className="text-xl font-bold mb-3">Strategy Engine</h2>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Run our AI-augmented calculation engine to find your optimal payoff date and compare Avalanche vs Snowball strategies.
              </p>
              <button 
                onClick={() => router.push('/dashboard/simulate')}
                className="w-full px-4 py-3 bg-white text-gray-900 font-bold rounded-md hover:bg-gray-100 transition shadow-sm"
              >
                Run Simulation →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
