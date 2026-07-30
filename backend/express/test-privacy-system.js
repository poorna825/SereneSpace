/**
 * Privacy System Test Script
 * Tests dual identity visibility: username (public) vs fullName/email (private)
 */

import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

let testUsers = {
  admin: { token: null, id: null },
  counselor: { token: null, id: null },
  patient1: { token: null, id: null },
  patient2: { token: null, id: null }
};

let testData = {
  postId: null,
  commentId: null,
  appointmentId: null
};

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function assert(condition, testName) {
  if (condition) {
    testsPassed++;
    log(`✓ ${testName}`, 'success');
  } else {
    testsFailed++;
    log(`✗ ${testName}`, 'error');
  }
}

async function test1_RegisterUsers() {
  log('\n========== TEST 1: User Registration ==========', 'info');
  
  try {
    // Register admin
    const admin = await axios.post(`${API_BASE}/register`, {
      username: 'admin_user',
      fullName: 'Admin Full Name',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });
    assert(admin.data.user.username === 'admin_user', 'Admin registered with username');
    assert(!admin.data.user.fullName, 'Admin registration response does NOT include fullName');
    assert(!admin.data.user.email, 'Admin registration response does NOT include email');
    
    // Register counselor
    const counselor = await axios.post(`${API_BASE}/register`, {
      username: 'counselor_jane',
      fullName: 'Jane Counselor',
      email: 'counselor@test.com',
      password: 'counselor123',
      role: 'counselor'
    });
    assert(counselor.data.user.username === 'counselor_jane', 'Counselor registered with username');
    
    // Register patient 1
    const patient1 = await axios.post(`${API_BASE}/register`, {
      username: 'patient_john',
      fullName: 'John Patient',
      email: 'patient1@test.com',
      password: 'patient123',
      role: 'user'
    });
    assert(patient1.data.user.username === 'patient_john', 'Patient1 registered with username');
    
    // Register patient 2
    const patient2 = await axios.post(`${API_BASE}/register`, {
      username: 'patient_sarah',
      fullName: 'Sarah Patient',
      email: 'patient2@test.com',
      password: 'patient123',
      role: 'user'
    });
    assert(patient2.data.user.username === 'patient_sarah', 'Patient2 registered with username');
    
    log('✓ All users registered successfully', 'success');
  } catch (err) {
    log(`✗ Registration failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 4;
  }
}

async function test2_LoginUsers() {
  log('\n========== TEST 2: User Login ==========', 'info');
  
  try {
    // Login admin
    const adminLogin = await axios.post(`${API_BASE}/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    testUsers.admin.token = adminLogin.data.token;
    testUsers.admin.id = adminLogin.data.user.id;
    assert(adminLogin.data.user.username === 'admin_user', 'Admin login returns username');
    assert(adminLogin.data.user.fullName === 'Admin Full Name', 'Admin login returns their own fullName');
    assert(adminLogin.data.user.email === 'admin@test.com', 'Admin login returns their own email');
    
    // Login counselor
    const counselorLogin = await axios.post(`${API_BASE}/login`, {
      email: 'counselor@test.com',
      password: 'counselor123'
    });
    testUsers.counselor.token = counselorLogin.data.token;
    testUsers.counselor.id = counselorLogin.data.user.id;
    assert(counselorLogin.data.user.fullName === 'Jane Counselor', 'Counselor login returns their own fullName');
    
    // Login patient 1
    const patient1Login = await axios.post(`${API_BASE}/login`, {
      email: 'patient1@test.com',
      password: 'patient123'
    });
    testUsers.patient1.token = patient1Login.data.token;
    testUsers.patient1.id = patient1Login.data.user.id;
    assert(patient1Login.data.user.fullName === 'John Patient', 'Patient login returns their own fullName');
    
    // Login patient 2
    const patient2Login = await axios.post(`${API_BASE}/login`, {
      email: 'patient2@test.com',
      password: 'patient123'
    });
    testUsers.patient2.token = patient2Login.data.token;
    testUsers.patient2.id = patient2Login.data.user.id;
    
    log('✓ All users logged in successfully', 'success');
  } catch (err) {
    log(`✗ Login failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 4;
  }
}

async function test3_ProfileAccess() {
  log('\n========== TEST 3: Profile Access ==========', 'info');
  
  try {
    // Patient1 views their own profile
    const ownProfile = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${testUsers.patient1.token}` }
    });
    assert(ownProfile.data.user.username === 'patient_john', 'Own profile shows username');
    assert(ownProfile.data.user.fullName === 'John Patient', 'Own profile shows fullName');
    assert(ownProfile.data.user.email === 'patient1@test.com', 'Own profile shows email');
    
    log('✓ Profile access working correctly', 'success');
  } catch (err) {
    log(`✗ Profile access failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 3;
  }
}

async function test4_PostsAndCommentsPrivacy() {
  log('\n========== TEST 4: Posts and Comments Privacy ==========', 'info');
  
  try {
    // Patient1 creates a post
    const post = await axios.post(`${API_BASE}/posts`,
      { title: 'Test Post', content: 'This is a test post' },
      { headers: { Authorization: `Bearer ${testUsers.patient1.token}` } }
    );
    testData.postId = post.data.post.id;
    
    // Patient2 creates a comment
    const comment = await axios.post(`${API_BASE}/posts/${testData.postId}/comments`,
      { content: 'Test comment' },
      { headers: { Authorization: `Bearer ${testUsers.patient2.token}` } }
    );
    testData.commentId = comment.data.comment.id;
    
    // Anonymous user views posts
    const publicView = await axios.get(`${API_BASE}/posts`);
    const postUser = publicView.data.posts[0].user;
    assert(postUser.username === 'patient_john', 'Public view shows username');
    assert(!postUser.fullName, 'Public view does NOT show fullName');
    assert(!postUser.email, 'Public view does NOT show email');
    
    // Check comment author
    const commentUser = publicView.data.posts[0].comments[0].user;
    assert(commentUser.username === 'patient_sarah', 'Comment shows username');
    assert(!commentUser.fullName, 'Comment does NOT show fullName');
    
    log('✓ Posts and comments show only username publicly', 'success');
  } catch (err) {
    log(`✗ Posts/comments privacy failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 4;
  }
}

async function test5_AppointmentPrivacy() {
  log('\n========== TEST 5: Appointment Privacy ==========', 'info');
  
  try {
    // Patient1 books an appointment with counselor
    const appointment = await axios.post(`${API_BASE}/appointments`,
      {
        counselorId: testUsers.counselor.id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString()
      },
      { headers: { Authorization: `Bearer ${testUsers.patient1.token}` } }
    );
    testData.appointmentId = appointment.data.appointment.id;
    
    // Counselor views their appointments (should see patient's full data)
    const counselorView = await axios.get(
      `${API_BASE}/appointments/counselor/${testUsers.counselor.id}`,
      { headers: { Authorization: `Bearer ${testUsers.counselor.token}` } }
    );
    const patientInfo = counselorView.data.appointments[0].user;
    assert(patientInfo.username === 'patient_john', 'Counselor sees patient username');
    assert(patientInfo.fullName === 'John Patient', 'Counselor sees patient fullName');
    assert(patientInfo.email === 'patient1@test.com', 'Counselor sees patient email');
    
    // Admin views all appointments (should see full data)
    const adminView = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${testUsers.admin.token}` }
    });
    const adminPatientView = adminView.data.appointments[0].user;
    assert(adminPatientView.fullName === 'John Patient', 'Admin sees patient fullName');
    assert(adminPatientView.email === 'patient1@test.com', 'Admin sees patient email');
    
    // Patient1 views their own appointments (regular user view)
    const patientView = await axios.get(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${testUsers.patient1.token}` }
    });
    const counselorInfoForPatient = patientView.data.appointments[0].counselor;
    assert(counselorInfoForPatient.username === 'counselor_jane', 'Patient sees counselor username');
    // Regular users see public info only
    assert(!counselorInfoForPatient.fullName, 'Patient does NOT see counselor fullName');
    
    log('✓ Appointment privacy rules working correctly', 'success');
  } catch (err) {
    log(`✗ Appointment privacy failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 6;
  }
}

async function test6_UserListPrivacy() {
  log('\n========== TEST 6: User List Privacy ==========', 'info');
  
  try {
    // Admin views all users (should see full info)
    const adminView = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${testUsers.admin.token}` }
    });
    const firstUser = adminView.data.users[0];
    assert(firstUser.username, 'Admin sees username in user list');
    assert(firstUser.fullName, 'Admin sees fullName in user list');
    assert(firstUser.email, 'Admin sees email in user list');
    
    // Counselor views all users (should see public info only)
    const counselorView = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${testUsers.counselor.token}` }
    });
    const counselorViewUser = counselorView.data.users[0];
    assert(counselorViewUser.username, 'Counselor sees username');
    assert(!counselorViewUser.fullName, 'Counselor does NOT see fullName in general user list');
    assert(!counselorViewUser.email, 'Counselor does NOT see email in general user list');
    
    log('✓ User list privacy working correctly', 'success');
  } catch (err) {
    log(`✗ User list privacy failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 6;
  }
}

async function test7_UserUpdatePrivacy() {
  log('\n========== TEST 7: User Update Privacy ==========', 'info');
  
  try {
    // Patient1 updates their own profile
    const updated = await axios.put(
      `${API_BASE}/users/${testUsers.patient1.id}`,
      {
        username: 'patient_john_updated',
        fullName: 'John Patient Updated'
      },
      { headers: { Authorization: `Bearer ${testUsers.patient1.token}` } }
    );
    assert(updated.data.user.username === 'patient_john_updated', 'User can update their username');
    assert(updated.data.user.fullName === 'John Patient Updated', 'User can update their fullName');
    
    // Try to update another user (should fail)
    try {
      await axios.put(
        `${API_BASE}/users/${testUsers.patient2.id}`,
        { fullName: 'Hacked Name' },
        { headers: { Authorization: `Bearer ${testUsers.patient1.token}` } }
      );
      assert(false, 'User CANNOT update another user (should have failed)');
    } catch (err) {
      assert(err.response?.status === 403, 'User CANNOT update another user (correctly blocked)');
    }
    
    log('✓ User update privacy working correctly', 'success');
  } catch (err) {
    log(`✗ User update privacy failed: ${err.response?.data?.error || err.message}`, 'error');
    testsFailed += 2;
  }
}

async function runAllTests() {
  log('========================================', 'warn');
  log('  PRIVACY SYSTEM TEST SUITE', 'warn');
  log('========================================', 'warn');
  log('Testing dual identity visibility:', 'info');
  log('  - Username: Public (visible to all)', 'info');
  log('  - FullName/Email: Private (admin + assigned counselor only)', 'info');
  log('========================================\n', 'warn');
  
  await test1_RegisterUsers();
  await test2_LoginUsers();
  await test3_ProfileAccess();
  await test4_PostsAndCommentsPrivacy();
  await test5_AppointmentPrivacy();
  await test6_UserListPrivacy();
  await test7_UserUpdatePrivacy();
  
  log('\n========================================', 'warn');
  log(`  TEST RESULTS:`, 'warn');
  log(`  Passed: ${testsPassed}`, 'success');
  log(`  Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
  log('========================================\n', 'warn');
  
  if (testsFailed === 0) {
    log('🎉 All tests passed! Privacy system is working correctly.', 'success');
  } else {
    log(`⚠️  ${testsFailed} test(s) failed. Please review the implementation.`, 'error');
  }
}

// Run tests
runAllTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
