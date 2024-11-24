const auth = require('./auth');
const navigation = require('./navigation');
const videoWatcher = require('./videoWatcher');
const { unstickVideo } = require('./task');

async function processUser(user) {
  console.log('Processing user:', JSON.stringify({ ...user, password: '[REDACTED]' }));
  console.log('User keys:', Object.keys(user));
  console.log('Telephone value:', user.telephone);
  console.log('Tier value:', user.tier);

  try {
    await auth.login(user.username, user.password);
    console.log('Login simulated');

    const success = await navigation.navigateToTier(user.tier);

    if (success) {
      console.log(`Successfully navigated to ${user.tier} page`);
      
      let continueWatching = true;
      while (continueWatching) {
        try {
          await videoWatcher.watchVideos(user);
          continueWatching = false;
        } catch (error) {
          console.error('Error during video watching:', error);
          console.log('Attempting to unstick video...');
          const unstuckSuccessfully = await unstickVideo(user);
          if (!unstuckSuccessfully) {
            console.log('Failed to unstick video. Stopping video watching for this user.');
            break;
          }
        }
      }
    } else {
      console.log(`Failed to navigate to ${user.tier} page`);
    }

  } catch (error) {
    console.error(`An error occurred while processing user ${user.username}:`, error);
    throw error;
  } finally {
    console.log(`Attempting to log out user: ${user.username}`);
    try {
      await auth.logout();
    } catch (logoutError) {
      console.error('Error during logout:', logoutError);
    }
  }

  return { message: `Processing completed for user ${user.username}` };
}

module.exports = {
  processUser
};