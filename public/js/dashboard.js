document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (!token || !username) {
      console.log('No token or username found, redirecting to login page');
      window.location.href = '/index.html';
      return;
  }
  console.log('Token and username found, user is authenticated');
  fetchUserTier();
  loadSavedCredentials();
  
  document.getElementById('logout').addEventListener('click', logout);
  document.getElementById('save-stagwell-credentials').addEventListener('click', saveStgwellCredentials);
  document.getElementById('upgrade-tier').addEventListener('click', upgradeTier);
  document.getElementById('schedule-automation').addEventListener('click', scheduleAutomation);
  document.getElementById('run-automation').addEventListener('click', runImmediateAutomation);
});

async function fetchUserTier() {
  try {
      const response = await fetch('/user-info', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
          const data = await response.json();
          const userTierElement = document.getElementById('user-tier');
          if (userTierElement && data.tier) {
              userTierElement.textContent = data.tier;
          }
      } else {
          throw new Error('Failed to fetch user tier');
      }
  } catch (error) {
      console.error('Error fetching user tier:', error);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = '/index.html';
}

async function saveStgwellCredentials() {
  const stagwellTelephone = document.getElementById('stagwell-telephone').value;
  const stagwellPassword = document.getElementById('stagwell-password').value;
  
  if (!stagwellTelephone || !stagwellPassword) {
      alert('Please complete both telephone and password fields before saving.');
      return;
  }

  try {
      const existingCreds = await fetch('/get-stagwell-credentials', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (existingCreds.ok) {
          const data = await existingCreds.json();
          if (data.stagwellTelephone) {
              if (data.stagwellTelephone === stagwellTelephone) {
                  alert('These credentials are already saved in the system.');
              } else {
                  alert('You already have Stagwell credentials saved. Only one set of credentials is allowed per account.');
              }
              return;
          }
      }

      const response = await fetch('/save-stagwell-credentials', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stagwellTelephone, stagwellPassword })
      });
      
      if (response.ok) {
          alert('Stagwell TV credentials saved successfully!');
          document.getElementById('stagwell-telephone').value = '';
          document.getElementById('stagwell-password').value = '';
          loadSavedCredentials();
      } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save credentials');
      }
  } catch (error) {
      console.error('Error saving Stagwell TV credentials:', error);
      alert(`Failed to save credentials: ${error.message}`);
  }
}

async function loadSavedCredentials() {
  try {
      const response = await fetch('/get-stagwell-credentials', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
          const data = await response.json();
          if (data.stagwellTelephone) {
              document.getElementById('stagwell-telephone').value = data.stagwellTelephone;
              document.getElementById('stagwell-telephone').disabled = true;
              document.getElementById('stagwell-password').value = '********';
              document.getElementById('stagwell-password').disabled = true;
          }
      }
  } catch (error) {
      console.error('Error loading saved credentials:', error);
  }
}

async function upgradeTier() {
  try {
      const response = await fetch('/user-info', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
          const data = await response.json();
          const currentTier = data.tier;
          const higherTiers = getHigherTiers(currentTier);
          
          if (higherTiers.length > 0) {
              const tierOptions = higherTiers.map(tier => `${tier} - R${getTierPrice(tier)}`).join('\n');
              const selectedTier = prompt(`Select the tier you want to upgrade to:\n${tierOptions}`);
              if (selectedTier) {
                  const tier = selectedTier.split(' - ')[0];
                  const confirmed = confirm(`Do you want to upgrade to tier ${tier}?`);
                  if (confirmed) {
                      const upgradeResponse = await fetch('/process-upgrade', {
                          method: 'POST',
                          headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`,
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ tier })
                      });
                      const result = await upgradeResponse.json();
                      if (result.success) {
                          alert(`Upgrade to ${tier} successful! Transaction ID: ${result.transactionId}`);
                          fetchUserTier();
                      } else {
                          alert(`Upgrade failed: ${result.error}`);
                      }
                  }
              }
          } else {
              alert('You are already on the highest tier.');
          }
      }
  } catch (error) {
      console.error('Error during upgrade:', error);
      alert('An error occurred during the upgrade process. Please try again.');
  }
}

function getHigherTiers(currentTier) {
  const tiers = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];
  const currentIndex = tiers.indexOf(currentTier);
  return tiers.slice(currentIndex + 1);
}

function getTierPrice(tier) {
  const tierPrices = { K1: 24, K2: 90, K3: 216, K4: 720, K5: 1380, K6: 2000, K7: 2500, K8: 3000 };
  return tierPrices[tier];
}

async function scheduleAutomation(e) {
  e.preventDefault();
  await runAutomation('/schedule-automation', 'Automation scheduled successfully!');
}

async function runImmediateAutomation(e) {
  e.preventDefault();
  await runAutomation('/run-immediate-automation', 'Immediate automation started successfully!');
}

async function runAutomation(endpoint, successMessage) {
  try {
      const [userResponse, credsResponse] = await Promise.all([
          fetch('/user-info', {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('/get-stagwell-credentials', {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
      ]);

      const userData = await userResponse.json();
      const credsData = await credsResponse.json();

      console.log('Fetched user data:', userData);
      console.log('Fetched credentials:', credsData);

      if (!credsData || !credsData.stagwellTelephone || !credsData.stagwellPassword) {
          alert('No valid Stagwell credentials found. Please save your credentials before starting automation.');
          return;
      }

      if (!userData || !userData.tier) {
          alert('User tier information is missing. Please try logging out and logging in again.');
          return;
      }

      const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              stagwellTelephone: credsData.stagwellTelephone,
              stagwellPassword: credsData.stagwellPassword,
              stagwellTier: userData.tier
          })
      });

      if (response.ok) {
          const result = await response.json();
          console.log('Automation response:', result);
          alert(successMessage);
      } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start automation');
      }
  } catch (error) {
      console.error('Error during automation:', error);
      alert(`Failed to start automation: ${error.message}`);
  }
}