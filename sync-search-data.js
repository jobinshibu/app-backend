import SearchService from './api/server/services/search.js';

async function runSync() {
  try {
    console.log('Starting search data sync...');
    const result = await SearchService.syncSearchData();
    console.log(result.message);
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync search data:', error);
    process.exit(1);
  }
}

runSync();
