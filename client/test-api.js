import fetch from 'node-fetch';

const API_BASE_URL = 'https://sih-hackthon-g8l7.onrender.com/api';

async function testAPI() {
  console.log('🧪 TESTING API ENDPOINTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Test server health
    console.log('\n1. Testing server health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server is running:', healthData.message);
    } else {
      console.log('❌ Server health check failed');
    }

    // Test get all issues (public endpoint)
    console.log('\n2. Testing get all issues...');
    const issuesResponse = await fetch(`${API_BASE_URL}/issues`);
    if (issuesResponse.ok) {
      const issuesData = await issuesResponse.json();
      console.log(`✅ Issues endpoint working - Found ${issuesData.issues.length} issues`);
      
      if (issuesData.issues.length > 0) {
        console.log('\n📋 Issues from API:');
        issuesData.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.title}`);
          console.log(`   Status: ${issue.status} | Priority: ${issue.priority}`);
          console.log(`   Category: ${issue.category}`);
          console.log(`   Location: ${issue.location.address}`);
          console.log(`   Reporter: ${issue.reportedBy?.name || 'Unknown'}`);
        });
      }
      
      console.log('\n📊 Pagination info:', issuesData.pagination);
    } else {
      console.log('❌ Issues endpoint failed');
    }

    // Test login (to get auth token for protected endpoints)
    console.log('\n3. Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ujjwal@gmail.com',
        password: '123456' // You might need to change this
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful for:', loginData.user.name);
      
      const token = loginData.token;
      
      // Test authenticated endpoint
      console.log('\n4. Testing my issues (authenticated)...');
      const myIssuesResponse = await fetch(`${API_BASE_URL}/issues/my-issues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (myIssuesResponse.ok) {
        const myIssuesData = await myIssuesResponse.json();
        console.log(`✅ My issues endpoint working - Found ${myIssuesData.issues.length} issues`);
      } else {
        console.log('❌ My issues endpoint failed');
      }
      
    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Login failed:', loginError.message);
      console.log('💡 Try updating the email/password in the test script');
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Make sure your server is running:');
    console.log('  npm run server');
    console.log('  or');
    console.log('  node server/index.js');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

testAPI();