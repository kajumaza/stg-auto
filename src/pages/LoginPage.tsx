import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    telephone: '',
    password: '',
    tier: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isRegistering) {
        // Check if username already exists
        const userQuery = query(collection(db, 'users'), where('username', '==', formData.username));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          throw new Error('Username already exists');
        }

        // Create new user
        await addDoc(collection(db, 'users'), {
          username: formData.username,
          email: formData.email,
          telephone: formData.telephone,
          password: formData.password, // In production, use proper password hashing
          'user-tier': formData.tier,
          createdAt: new Date().toISOString()
        });

        alert('Registration successful. Please log in.');
        setIsRegistering(false);
        setFormData({ username: '', email: '', telephone: '', password: '', tier: '' });
      } else {
        // Login
        const userQuery = query(collection(db, 'users'), where('username', '==', formData.username));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          throw new Error('User not found');
        }

        const userData = userSnapshot.docs[0].data();
        if (userData.password !== formData.password) { // In production, use proper password comparison
          throw new Error('Invalid password');
        }

        // Create a simple token (in production, use proper JWT)
        const token = btoa(JSON.stringify({
          username: userData.username,
          exp: new Date().getTime() + (60 * 60 * 1000) // 1 hour expiration
        }));
        
        login(token, userData.username);
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserCircle className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Username"
              disabled={loading}
            />
            {isRegistering && (
              <>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  disabled={loading}
                />
                <input
                  type="tel"
                  name="telephone"
                  required
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Telephone"
                  disabled={loading}
                />
                <select
                  name="tier"
                  required
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  disabled={loading}
                >
                  <option value="">Select Tier</option>
                  <option value="K1">K1 - R24/month</option>
                  <option value="K2">K2 - R90/month</option>
                  <option value="K3">K3 - R216/month</option>
                  <option value="K4">K4 - R720/month</option>
                  <option value="K5">K5 - R1380/month</option>
                  <option value="K6">K6 - R2000/month</option>
                  <option value="K7">K7 - R2500/month</option>
                  <option value="K8">K8 - R3000/month</option>
                </select>
              </>
            )}
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign in')}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormData({ username: '', email: '', telephone: '', password: '', tier: '' });
              setError(null);
            }}
            className="text-indigo-600 hover:text-indigo-500"
            disabled={loading}
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;