import mongoose from 'mongoose';
// import config from './server/config.js';
import Issue from './server/models/Issue.js';
import User from './server/models/User.js';

async function viewDatabaseData() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get command line arguments for filtering
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    switch(command.toLowerCase()) {
      case 'issues':
      case 'all':
        await showIssues(args[1]);
        break;
      case 'users':
        await showUsers();
        break;
      case 'stats':
        await showStatistics();
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
    }

  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function showIssues(filter) {
  console.log('\n📋 ISSUES DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let query = {};
  
  // Apply filters
  if (filter) {
    switch(filter.toLowerCase()) {
      case 'pending':
        query.status = 'pending';
        break;
      case 'resolved':
        query.status = 'resolved';
        break;
      case 'in-progress':
        query.status = 'in-progress';
        break;
      case 'high':
        query.priority = 'high';
        break;
      case 'medium':
        query.priority = 'medium';
        break;
      case 'low':
        query.priority = 'low';
        break;
      default:
        query.category = filter.toLowerCase();
    }
    console.log(`🔍 Filter applied: ${filter}`);
  }

  const issues = await Issue.find(query)
    .populate('reportedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.user', 'name email')
    .sort({ createdAt: -1 });

  console.log(`📊 Issues found: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('❌ No issues found with the current filter.');
    return;
  }

  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. 📋 ${issue.title}`);
    console.log(`   🆔 ID: ${issue._id}`);
    console.log(`   🏷️  ${issue.category} | ⚡ ${issue.status.toUpperCase()} | 🚨 ${issue.priority.toUpperCase()}`);
    console.log(`   📍 ${issue.location.address}`);
    console.log(`   👤 Reported by: ${issue.reportedBy?.name || 'Unknown'}`);
    console.log(`   📅 ${issue.createdAt.toLocaleDateString()} ${issue.createdAt.toLocaleTimeString()}`);
    console.log(`   👍 ${issue.upvotes.length} upvotes | 💬 ${issue.comments.length} comments`);
    
    if (issue.assignedTo) {
      console.log(`   👮 Assigned to: ${issue.assignedTo.name}`);
    }
  });
}

async function showUsers() {
  console.log('\n👥 USERS DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const users = await User.find().sort({ createdAt: -1 });
  console.log(`📊 Users found: ${users.length}\n`);

  if (users.length === 0) {
    console.log('❌ No users found in the database.');
    return;
  }

  users.forEach((user, index) => {
    console.log(`\n${index + 1}. 👤 ${user.name}`);
    console.log(`   🆔 ID: ${user._id}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🏷️  Role: ${user.role.toUpperCase()}`);
    console.log(`   📱 Phone: ${user.phone || 'Not provided'}`);
    console.log(`   ⭐ Civic Score: ${user.civicScore}`);
    console.log(`   ✅ Verified: ${user.verified ? 'Yes' : 'No'}`);
    console.log(`   🟢 Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   📅 Joined: ${user.createdAt.toLocaleDateString()} ${user.createdAt.toLocaleTimeString()}`);
  });
}

async function showStatistics() {
  console.log('\n📊 DATABASE STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Get counts
  const totalIssues = await Issue.countDocuments();
  const totalUsers = await User.countDocuments();
  
  console.log(`📋 Total Issues: ${totalIssues}`);
  console.log(`👥 Total Users: ${totalUsers}`);

  if (totalIssues > 0) {
    // Issue statistics
    const statusStats = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Issues by Status:');
    statusStats.forEach(stat => {
      console.log(`   ${stat._id.toUpperCase()}: ${stat.count}`);
    });

    console.log('\n📊 Issues by Category:');
    categoryStats.forEach(stat => {
      console.log(`   ${stat._id.toUpperCase()}: ${stat.count}`);
    });

    console.log('\n📊 Issues by Priority:');
    priorityStats.forEach(stat => {
      console.log(`   ${stat._id.toUpperCase()}: ${stat.count}`);
    });

    // Additional statistics
    const totalUpvotes = await Issue.aggregate([
      { $project: { upvoteCount: { $size: '$upvotes' } } },
      { $group: { _id: null, total: { $sum: '$upvoteCount' } } }
    ]);

    const totalComments = await Issue.aggregate([
      { $project: { commentCount: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$commentCount' } } }
    ]);

    console.log(`\n👍 Total Upvotes: ${totalUpvotes[0]?.total || 0}`);
    console.log(`💬 Total Comments: ${totalComments[0]?.total || 0}`);
  }

  if (totalUsers > 0) {
    // User statistics
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const verifiedStats = await User.aggregate([
      { $group: { _id: '$verified', count: { $sum: 1 } } }
    ]);

    console.log('\n👥 Users by Role:');
    roleStats.forEach(stat => {
      console.log(`   ${stat._id.toUpperCase()}: ${stat.count}`);
    });

    console.log('\n✅ Users by Verification Status:');
    verifiedStats.forEach(stat => {
      console.log(`   ${stat._id ? 'VERIFIED' : 'NOT VERIFIED'}: ${stat.count}`);
    });
  }
}

function showHelp() {
  console.log('\n📖 DATABASE VIEWER HELP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Usage: node database-viewer.js [command] [filter]');
  console.log('\nCommands:');
  console.log('  all, issues    Show all issues (default)');
  console.log('  users         Show all users');
  console.log('  stats         Show database statistics');
  console.log('  help          Show this help message');
  console.log('\nIssue Filters (use with issues command):');
  console.log('  pending       Show only pending issues');
  console.log('  resolved      Show only resolved issues');
  console.log('  in-progress   Show only in-progress issues');
  console.log('  high          Show only high priority issues');
  console.log('  medium        Show only medium priority issues');
  console.log('  low           Show only low priority issues');
  console.log('  pothole       Show only pothole issues');
  console.log('  streetlight   Show only streetlight issues');
  console.log('  garbage       Show only garbage issues');
  console.log('  water-leak    Show only water leak issues');
  console.log('  road-damage   Show only road damage issues');
  console.log('  traffic-signal Show only traffic signal issues');
  console.log('  drainage      Show only drainage issues');
  console.log('  other         Show only other category issues');
  console.log('\nExamples:');
  console.log('  node database-viewer.js                    # Show all issues');
  console.log('  node database-viewer.js issues pending     # Show only pending issues');
  console.log('  node database-viewer.js users              # Show all users');
  console.log('  node database-viewer.js stats              # Show database statistics');
  console.log('  node database-viewer.js issues water-leak  # Show only water leak issues');
}

// Run the script
viewDatabaseData();