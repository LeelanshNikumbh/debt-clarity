'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Simulate() {
  const [budget, setBudget] = useState('1000');
  const [strategy, setStrategy] = useState('avalanche');
  const [results, setResults] = useState<any>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSimulate = async () => {
    setLoading(true);
    setExplanation('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ budget: parseFloat(budget), strategy })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      
      fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ budget: parseFloat(budget), strategy })
      })
      .then(r => r.json())
      .then(ai => setExplanation(ai.explanation))
      .catch(() => setExplanation('Failed to fetch AI insights. Showing fallback results.'));

    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-[80vh]">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-900 transition font-medium">← Back to Dashboard</button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Strategy Simulation</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Configuration</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget ($)</label>
              <input type="number" className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={budget} onChange={e => setBudget(e.target.value)} />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">Must be greater than the sum of all your minimum payments.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
              <select className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={strategy} onChange={e => setStrategy(e.target.value)}>
                <option value="avalanche">Avalanche (Highest APR first)</option>
                <option value="snowball">Snowball (Lowest Balance first)</option>
              </select>
            </div>
            <button onClick={handleSimulate} disabled={loading} className="w-full px-4 py-3 mt-4 bg-gray-900 text-white font-bold rounded-md hover:bg-gray-800 transition disabled:opacity-70 shadow-sm">
              {loading ? 'Crunching numbers...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {!results && !loading && (
            <div className="bg-gray-50 p-12 rounded-xl border border-gray-200 border-dashed text-center h-full flex flex-col justify-center">
              <p className="text-gray-500">Configure your budget and click Run Simulation to see your payoff timeline and AI insights.</p>
            </div>
          )}
          {results && (
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Payoff Results</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800 font-semibold uppercase tracking-wider mb-2">Months to Payoff</p>
                  <p className="text-5xl font-black text-blue-900">{results.months_to_payoff}</p>
                </div>
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-800 font-semibold uppercase tracking-wider mb-2">Total Interest Paid</p>
                  <p className="text-5xl font-black text-emerald-900">${results.total_interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
              
              <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 p-1 rounded">✨</span> AI Strategy Advisor
              </h3>
              <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 text-gray-800 min-h-[120px] shadow-inner">
                {explanation ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-gray-700">{explanation}</p>
                ) : (
                  <div className="flex items-center gap-3 text-indigo-500 font-medium">
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    Generating custom financial insights...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
