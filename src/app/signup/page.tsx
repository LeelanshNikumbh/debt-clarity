'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        // Extract validation details if available
        if (data.details && Array.isArray(data.details)) {
           throw new Error(data.details[0].message);
        }
        throw new Error(data.error || 'Signup failed');
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Sign Up</h1>
        {error && <div className="mb-6 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Min 8 characters, at least 1 letter and 1 number.</p>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 px-4 mt-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
