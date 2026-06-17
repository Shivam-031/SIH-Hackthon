// MongoDB Atlas Configuration

export default {
  // MongoDB Atlas Connection String
  // Replace <username>, <password>, and <cluster-url> with your actual values
  MONGODB_URI: 'mongodb+srv://ujjwal13032005_db_user:4PffkK8vKQZlYZIr@cluster1.wl6hplh.mongodb.net/civicconnect?retryWrites=true&w=majority&appName=Cluster1',
  
  // JWT Secret Key (generate a strong random string)
  JWT_SECRET: 'civicconnect-super-secret-jwt-key-2024-secure-auth-token',
  
  // Server Port
  PORT: 5000,
  
  // Environment
  NODE_ENV: 'development'
};
