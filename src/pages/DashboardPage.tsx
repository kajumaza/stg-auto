import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { LogOut, ChevronUp } from 'lucide-react';

interface UserInfo {
  username: string;
  tier: string;
}

interface StagwellCredentials {
  telephone: string;
  password: string;
}

function DashboardPage() {
  const { username, logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState('');
  const [stagwellCredentials, setStagwellCredentials] = useState<StagwellCredentials>({
    telephone: '',
    password: ''
  });
  const [telephoneLocked, setTelephoneLocked] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!username) return;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserInfo({
            username: userData.username,
            tier: userData['user-tier']
          });

          // Load Stagwell credentials if they exist
          if (userData.stagwellTelephone) {
            setStagwellCredentials({
              telephone: userData.stagwellTelephone,
              password: userData.stagwellPassword || ''
            });
            setTelephoneLocked(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [username]);

  const handleSaveCredentials = async () => {
    if (!username || !stagwellCredentials.telephone || !stagwellCredentials.password) return;
    
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await setDoc(doc(db, 'users', userDoc.id), {
          stagwellTelephone: stagwellCredentials.telephone,
          stagwellPassword: stagwellCredentials.password
        }, { merge: true });
        
        setTelephoneLocked(true);
        alert('Credentials saved successfully!');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      alert('Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeTier = async () => {
    if (!userInfo?.tier) return;
    setShowUpgradeModal(true);
  };

  const handleUpgradeConfirm = async () => {
    if (!selectedUpgradeTier) {
      alert('Please select a tier to upgrade to');
      return;
    }

    const confirmed = confirm(`Are you sure you want to upgrade to ${selectedUpgradeTier}?`);
    if (!confirmed) return;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await setDoc(doc(db, 'users', userDoc.id), {
          'user-tier': selectedUpgradeTier
        }, { merge: true });
        
        setUserInfo(prev => prev ? { ...prev, tier: selectedUpgradeTier } : null);
        alert(`Successfully upgraded to ${selectedUpgradeTier}`);
        setShowUpgradeModal(false);
        setSelectedUpgradeTier('');
      }
    } catch (error) {
      console.error('Error upgrading tier:', error);
      alert('Failed to upgrade tier');
    }
  };

  const getHigherTiers = (currentTier: string) => {
    const tiers = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];
    const currentIndex = tiers.indexOf(currentTier);
    return tiers.slice(currentIndex + 1);
  };

  const getTierPrice = (tier: string) => {
    const tierPrices = {
      K1: 24, K2: 90, K3: 216, K4: 720,
      K5: 1380, K6: 2000, K7: 2500, K8: 3000
    };
    return tierPrices[tier as keyof typeof tierPrices];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-4">
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>
          <p>Username: {userInfo?.username}</p>
          <p>Current Tier: {userInfo?.tier || 'Loading...'}</p>
          <button
            onClick={handleUpgradeTier}
            className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <ChevronUp size={20} />
            Upgrade Tier
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Stagwell TV Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={stagwellCredentials.telephone}
                onChange={(e) => setStagwellCredentials(prev => ({ ...prev, telephone: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter your Stagwell TV phone number"
                disabled={telephoneLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={stagwellCredentials.password}
                onChange={(e) => setStagwellCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter your Stagwell TV password"
              />
            </div>
            <button
              onClick={handleSaveCredentials}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Automation Controls</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Run Immediate Automation
            </button>
            <button
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Schedule Automation
            </button>
          </div>
        </div>

        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Upgrade Tier</h3>
              <select
                value={selectedUpgradeTier}
                onChange={(e) => setSelectedUpgradeTier(e.target.value)}
                className="w-full mb-4 p-2 border rounded"
              >
                <option value="">Select a tier</option>
                {userInfo?.tier && getHigherTiers(userInfo.tier).map(tier => (
                  <option key={tier} value={tier}>
                    {tier} - R{getTierPrice(tier)}/month
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedUpgradeTier('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgradeConfirm}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;