import mongoose from 'mongoose';
// import config from './server/config.js';
import Issue from './server/models/Issue.js';
import User from './server/models/User.js';

async function viewDatabaseIssues() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get all issues with populated user data
    console.log('\n📋 Fetching all issues from database...');
    const issues = await Issue.find()
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Total issues found: ${issues.length}\n`);

    if (issues.length === 0) {
      console.log('❌ No issues found in the database.');
      console.log('💡 Try creating some issues through the web application first.');
    } else {
      // Display detailed information for each issue
      issues.forEach((issue, index) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📋 ISSUE #${index + 1}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🆔 ID: ${issue._id}`);
        console.log(`📝 Title: ${issue.title}`);
        console.log(`📖 Description: ${issue.description}`);
        console.log(`🏷️  Category: ${issue.category}`);
        console.log(`📍 Location:`);
        console.log(`   📍 Address: ${issue.location.address}`);
        console.log(`   🌍 Coordinates: ${issue.location.latitude}, ${issue.location.longitude}`);
        console.log(`⚡ Status: ${issue.status.toUpperCase()}`);
        console.log(`🚨 Priority: ${issue.priority.toUpperCase()}`);
        
        if (issue.reportedBy) {
          console.log(`👤 Reported by: ${issue.reportedBy.name} (${issue.reportedBy.email}) - Role: ${issue.reportedBy.role}`);
        }
        
        if (issue.assignedTo) {
          console.log(`👮 Assigned to: ${issue.assignedTo.name} (${issue.assignedTo.email}) - Role: ${issue.assignedTo.role}`);
        } else {
          console.log(`👮 Assigned to: Not assigned`);
        }
        
        console.log(`👍 Upvotes: ${issue.upvotes.length}`);
        console.log(`💬 Comments: ${issue.comments.length}`);
        console.log(`✅ Verification Count: ${issue.verificationCount}`);
        console.log(`📅 Created: ${issue.createdAt.toLocaleString()}`);
        console.log(`📅 Updated: ${issue.updatedAt.toLocaleString()}`);
        
        if (issue.estimatedResolution) {
          console.log(`⏰ Estimated Resolution: ${issue.estimatedResolution.toLocaleString()}`);
        }
        
        if (issue.actualResolution) {
          console.log(`✅ Actual Resolution: ${issue.actualResolution.toLocaleString()}`);
        }

        // Display images if any
        if (issue.images && issue.images.length > 0) {
          console.log(`🖼️  Images: ${issue.images.length} attached`);
          issue.images.forEach((img, imgIndex) => {
            console.log(`   📎 Image ${imgIndex + 1}: ${img}`);
          });
        }

        // Display comments if any
        if (issue.comments && issue.comments.length > 0) {
          console.log(`💬 Comments:`);
          issue.comments.forEach((comment, commentIndex) => {
            const userName = comment.user ? comment.user.name : 'Unknown User';
            console.log(`   💬 Comment ${commentIndex + 1} by ${userName}:`);
            console.log(`      "${comment.text}"`);
            console.log(`      📅 ${comment.timestamp.toLocaleString()}`);
          });
        }
      });

      // Summary statistics
      console.log(`\n\n📊 SUMMARY STATISTICS`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Group by status
      const statusCounts = issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`📊 Issues by Status:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status.toUpperCase()}: ${count}`);
      });

      // Group by category
      const categoryCounts = issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`\n📊 Issues by Category:`);
      Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`   ${category.toUpperCase()}: ${count}`);
      });

      // Group by priority
      const priorityCounts = issues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`\n📊 Issues by Priority:`);
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        console.log(`   ${priority.toUpperCase()}: ${count}`);
      });

      console.log(`\n📊 Total Upvotes Across All Issues: ${issues.reduce((sum, issue) => sum + issue.upvotes.length, 0)}`);
      console.log(`📊 Total Comments Across All Issues: ${issues.reduce((sum, issue) => sum + issue.comments.length, 0)}`);
    }

  } catch (error) {
    console.error('❌ Error connecting to database or fetching issues:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure your MongoDB connection string in server/config.js is correct');
    console.error('2. Check your internet connection');
    console.error('3. Verify your MongoDB Atlas cluster is running');
    console.error('4. Ensure your IP address is whitelisted in MongoDB Atlas');
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
viewDatabaseIssues();