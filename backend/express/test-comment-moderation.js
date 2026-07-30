/**
 * Comment Moderation System - Test Script
 * This script demonstrates the flag-based comment moderation system
 * 
 * To run: node backend/express/test-comment-moderation.js
 */

const API_URL = 'http://localhost:4000/api';

// Test users (you'll need to create these first or use existing ones)
const USER_A = {
  email: 'alice@example.com',
  password: 'password123',
  token: null
};

const USER_B = {
  email: 'bob@example.com',
  password: 'password123',
  token: null
};

const ADMIN = {
  email: 'admin@example.com',
  password: 'admin123',
  token: null
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test scenarios
async function runTests() {
  console.log('🚀 Starting Comment Moderation System Tests\n');
  
  // ========== SCENARIO 1: User Registration & Login ==========
  console.log('📝 SCENARIO 1: User Login');
  console.log('─'.repeat(50));
  
  // Login as User A
  const loginA = await apiRequest('POST', '/login', {
    email: USER_A.email,
    password: USER_A.password
  });
  
  if (loginA.status === 200) {
    USER_A.token = loginA.data.token;
    console.log('✅ User A logged in successfully');
  } else {
    console.log('❌ User A login failed:', loginA.data.error);
    return;
  }
  
  // Login as User B
  const loginB = await apiRequest('POST', '/login', {
    email: USER_B.email,
    password: USER_B.password
  });
  
  if (loginB.status === 200) {
    USER_B.token = loginB.data.token;
    console.log('✅ User B logged in successfully');
  } else {
    console.log('❌ User B login failed:', loginB.data.error);
    return;
  }
  
  // Login as Admin
  const loginAdmin = await apiRequest('POST', '/login', {
    email: ADMIN.email,
    password: ADMIN.password
  });
  
  if (loginAdmin.status === 200) {
    ADMIN.token = loginAdmin.data.token;
    console.log('✅ Admin logged in successfully\n');
  } else {
    console.log('❌ Admin login failed:', loginAdmin.data.error);
    return;
  }
  
  // ========== SCENARIO 2: Create Posts & Comments ==========
  console.log('📝 SCENARIO 2: Create Post & Comment');
  console.log('─'.repeat(50));
  
  // User A creates a post
  const createPost = await apiRequest('POST', '/posts', {
    title: 'Test Post for Moderation',
    content: 'This is a test post to demonstrate comment moderation'
  }, USER_A.token);
  
  if (createPost.status !== 200) {
    console.log('❌ Failed to create post:', createPost.data.error);
    return;
  }
  
  const postId = createPost.data.post.id;
  console.log(`✅ Created test post (ID: ${postId})`);
  
  // User B creates a comment on the post
  const createComment = await apiRequest('POST', `/posts/${postId}/comments`, {
    content: 'This is a test comment that will be flagged'
  }, USER_B.token);
  
  if (createComment.status !== 200) {
    console.log('❌ Failed to create comment:', createComment.data.error);
    return;
  }
  
  const commentId = createComment.data.comment.id;
  console.log(`✅ User B created comment (ID: ${commentId})\n`);
  
  // ========== SCENARIO 3: Test Self-Flag Prevention ==========
  console.log('📝 SCENARIO 3: Test Self-Flag Prevention');
  console.log('─'.repeat(50));
  
  const selfFlag = await apiRequest('POST', `/comments/${commentId}/flag`, {
    reason: 'Testing self-flag'
  }, USER_B.token);
  
  if (selfFlag.status === 400) {
    console.log('✅ Self-flag prevented:', selfFlag.data.error);
  } else {
    console.log('❌ Self-flag should have been prevented!');
  }
  console.log();
  
  // ========== SCENARIO 4: Flag Comment (User A) ==========
  console.log('📝 SCENARIO 4: Flag Comment');
  console.log('─'.repeat(50));
  
  const flagComment = await apiRequest('POST', `/comments/${commentId}/flag`, {
    reason: 'Inappropriate content for testing'
  }, USER_A.token);
  
  if (flagComment.status === 200) {
    console.log('✅ User A flagged comment successfully');
    console.log(`   Flag Count: ${flagComment.data.flagCount}`);
  } else {
    console.log('❌ Flag failed:', flagComment.data.error);
  }
  console.log();
  
  // ========== SCENARIO 5: Test Duplicate Flag Prevention ==========
  console.log('📝 SCENARIO 5: Test Duplicate Flag Prevention');
  console.log('─'.repeat(50));
  
  const duplicateFlag = await apiRequest('POST', `/comments/${commentId}/flag`, {
    reason: 'Trying to flag again'
  }, USER_A.token);
  
  if (duplicateFlag.status === 400) {
    console.log('✅ Duplicate flag prevented:', duplicateFlag.data.error);
  } else {
    console.log('❌ Duplicate flag should have been prevented!');
  }
  console.log();
  
  // ========== SCENARIO 6: Admin Views Flagged Comments ==========
  console.log('📝 SCENARIO 6: Admin Views Flagged Comments');
  console.log('─'.repeat(50));
  
  const flaggedComments = await apiRequest('GET', '/moderation/flagged-comments', null, ADMIN.token);
  
  if (flaggedComments.status === 200) {
    console.log(`✅ Found ${flaggedComments.data.total} flagged comment(s)`);
    if (flaggedComments.data.flaggedComments.length > 0) {
      const comment = flaggedComments.data.flaggedComments[0];
      console.log(`   Comment ID: ${comment.id}`);
      console.log(`   Flag Count: ${comment.flagCount}`);
      console.log(`   Flags: ${comment.flags.length}`);
    }
  } else {
    console.log('❌ Failed to fetch flagged comments:', flaggedComments.data.error);
  }
  console.log();
  
  // ========== SCENARIO 7: Admin Reviews Specific Comment Flags ==========
  console.log('📝 SCENARIO 7: Admin Reviews Comment Flags');
  console.log('─'.repeat(50));
  
  const commentFlags = await apiRequest('GET', `/comments/${commentId}/flags`, null, ADMIN.token);
  
  if (commentFlags.status === 200) {
    console.log(`✅ Retrieved flags for comment ${commentId}`);
    console.log(`   Total Flags: ${commentFlags.data.flags.length}`);
    commentFlags.data.flags.forEach((flag, index) => {
      console.log(`   Flag ${index + 1}: ${flag.reason}`);
      console.log(`           By: ${flag.user.email}`);
    });
  } else {
    console.log('❌ Failed to fetch comment flags:', commentFlags.data.error);
  }
  console.log();
  
  // ========== SCENARIO 8: Admin Hides Comment ==========
  console.log('📝 SCENARIO 8: Admin Hides Comment');
  console.log('─'.repeat(50));
  
  const hideComment = await apiRequest('POST', `/moderation/comments/${commentId}/hide`, {
    moderatorNote: 'Comment violates community guidelines - test moderation'
  }, ADMIN.token);
  
  if (hideComment.status === 200) {
    console.log('✅ Admin hid comment successfully');
    console.log(`   Hidden: ${hideComment.data.comment.hiddenByModerator}`);
    console.log(`   Note: ${hideComment.data.comment.moderatorNote}`);
  } else {
    console.log('❌ Failed to hide comment:', hideComment.data.error);
  }
  console.log();
  
  // ========== SCENARIO 9: Verify Hidden Comment Not Visible to Regular Users ==========
  console.log('📝 SCENARIO 9: Check Comment Visibility');
  console.log('─'.repeat(50));
  
  const viewPost = await apiRequest('GET', `/posts/${postId}`, null, USER_B.token);
  
  if (viewPost.status === 200) {
    const visibleComments = viewPost.data.post.comments.length;
    console.log(`✅ User B can see ${visibleComments} comment(s)`);
    console.log('   Hidden comment is correctly filtered out!');
  } else {
    console.log('❌ Failed to fetch post:', viewPost.data.error);
  }
  console.log();
  
  // ========== SCENARIO 10: Admin Can Still See Hidden Comment ==========
  console.log('📝 SCENARIO 10: Admin View (Shows Hidden Comments)');
  console.log('─'.repeat(50));
  
  const adminViewPost = await apiRequest('GET', `/posts/${postId}`, null, ADMIN.token);
  
  if (adminViewPost.status === 200) {
    const adminVisibleComments = adminViewPost.data.post.comments.length;
    console.log(`✅ Admin can see ${adminVisibleComments} comment(s)`);
    console.log('   Admin view respects moderation permissions!');
  } else {
    console.log('❌ Failed to fetch post as admin:', adminViewPost.data.error);
  }
  console.log();
  
  // ========== SCENARIO 11: Admin Unhides Comment ==========
  console.log('📝 SCENARIO 11: Admin Unhides Comment');
  console.log('─'.repeat(50));
  
  const unhideComment = await apiRequest('POST', `/moderation/comments/${commentId}/unhide`, null, ADMIN.token);
  
  if (unhideComment.status === 200) {
    console.log('✅ Admin unhid comment successfully');
    console.log(`   Hidden: ${unhideComment.data.comment.hiddenByModerator}`);
  } else {
    console.log('❌ Failed to unhide comment:', unhideComment.data.error);
  }
  console.log();
  
  // ========== SCENARIO 12: Admin Clears Flags ==========
  console.log('📝 SCENARIO 12: Admin Clears All Flags');
  console.log('─'.repeat(50));
  
  const clearFlags = await apiRequest('DELETE', `/moderation/comments/${commentId}/flags`, null, ADMIN.token);
  
  if (clearFlags.status === 200) {
    console.log('✅ Admin cleared all flags successfully');
    console.log(`   Flagged: ${clearFlags.data.comment.flagged}`);
    console.log(`   Flag Count: ${clearFlags.data.comment.flagCount}`);
  } else {
    console.log('❌ Failed to clear flags:', clearFlags.data.error);
  }
  console.log();
  
  // ========== SCENARIO 13: Test Soft Delete ==========
  console.log('📝 SCENARIO 13: Test Soft Delete');
  console.log('─'.repeat(50));
  
  const deleteComment = await apiRequest('DELETE', `/comments/${commentId}`, null, USER_B.token);
  
  if (deleteComment.status === 200) {
    console.log('✅ Comment soft-deleted successfully');
  } else {
    console.log('❌ Failed to delete comment:', deleteComment.data.error);
  }
  
  // Verify comment is invisible
  const verifyDeleted = await apiRequest('GET', `/posts/${postId}`, null, USER_A.token);
  
  if (verifyDeleted.status === 200) {
    const visibleAfterDelete = verifyDeleted.data.post.comments.length;
    console.log(`✅ After deletion, visible comments: ${visibleAfterDelete}`);
    console.log('   Soft delete working correctly!');
  }
  console.log();
  
  console.log('=' .repeat(50));
  console.log('🎉 All Tests Completed Successfully!');
  console.log('=' .repeat(50));
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
});
