# MongoDB Atlas Setup Guide

This guide will help you connect your CivicConnect app to MongoDB Cloud (MongoDB Atlas).

## Prerequisites

- A MongoDB Atlas account (free tier available)
- Node.js and npm installed

## Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account if you don't have one
3. Create a new project called "CivicConnect"
4. Click "Build a Database"
5. Choose "FREE" tier (M0)
6. Select a cloud provider and region close to you
7. Give your cluster a name (e.g., "civicconnect-cluster")
8. Click "Create"

## Step 2: Configure Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. Under "Database User Privileges", select "Atlas admin" or "Read and write to any database"
6. Click "Add User"

## Step 3: Configure Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production, add your specific IP addresses
5. Click "Confirm"

## Step 4: Get Connection String

1. In the left sidebar, click "Database"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string (it will look like this):
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
   ```

## Step 5: Configure Your Application

1. Copy `server/config.example.js` to `server/config.js`
2. Replace the placeholder values:
   ```javascript
   module.exports = {
     MONGODB_URI: 'mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/civicconnect?retryWrites=true&w=majority',
     JWT_SECRET: 'your-super-secret-jwt-key-here-generate-a-random-string',
     PORT: 5000,
     NODE_ENV: 'development'
   };
   ```
3. Generate a strong JWT secret key (you can use an online generator)

## Step 6: Install Dependencies and Run

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run server
   ```

3. In another terminal, start the frontend:
   ```bash
   npm run dev
   ```

4. Or run both together:
   ```bash
   npm run dev:full
   ```

## Step 7: Test the Connection

1. Open your browser and go to `http://localhost:5173`
2. Try registering a new user
3. Check the server console for "Connected to MongoDB Atlas" message
4. Check your MongoDB Atlas dashboard to see the new database and collections

## Database Collections

The app will automatically create these collections:
- `users` - User accounts and profiles
- `issues` - Civic issues reported by users

## Security Notes

- Never commit your `config.js` file to version control
- Use environment variables in production
- Regularly rotate your JWT secret key
- Use proper network access restrictions in production
- Enable MongoDB Atlas security features like encryption at rest

## Troubleshooting

### Connection Issues
- Verify your connection string is correct
- Check that your IP address is whitelisted
- Ensure your database user has proper permissions

### Authentication Issues
- Verify your JWT secret key is set correctly
- Check that the server is running on the correct port
- Ensure CORS is properly configured

### Common Errors
- `MongoServerError: bad auth` - Check username/password
- `MongoNetworkError` - Check network access and connection string
- `JWT_SECRET` errors - Ensure JWT secret is set in config

## Production Deployment

For production deployment:
1. Use environment variables instead of config files
2. Set up proper SSL/TLS certificates
3. Configure proper CORS origins
4. Use MongoDB Atlas connection limits and monitoring
5. Set up database backups
6. Implement rate limiting and security headers

## Support

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Verify your connection string format
3. Check the server console for error messages
4. Ensure all dependencies are installed correctly
