// Export database instance and schema
export { db, database } from './database';
export * from './schema';

// Initialize database on import
import { database } from './database';

// Ensure database is initialized
database.healthCheck().then(isHealthy => {
  if (isHealthy) {
    console.log('✅ Database is healthy and ready');
  } else {
    console.error('❌ Database health check failed');
  }
}).catch(error => {
  console.error('❌ Database initialization error:', error);
});