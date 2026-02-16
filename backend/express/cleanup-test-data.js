/**
 * Cleanup script to remove test data created by test-privacy-system.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');

  try {
    // Test user emails to delete
    const testEmails = [
      'admin@test.com',
      'counselor@test.com',
      'patient1@test.com',
      'patient2@test.com'
    ];

    // Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: testEmails
        }
      }
    });

    if (testUsers.length === 0) {
      console.log('✓ No test data found. Database is clean.');
      return;
    }

    const userIds = testUsers.map(u => u.id);
    console.log(`Found ${testUsers.length} test users:`, testUsers.map(u => u.email).join(', '));

    // Delete associated data
    console.log('\n🗑️  Deleting associated data...');

    // Delete comment flags
    const deletedFlags = await prisma.commentFlag.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { comment: { userId: { in: userIds } } }
        ]
      }
    });
    console.log(`  ✓ Deleted ${deletedFlags.count} comment flags`);

    // Delete post reactions
    const deletedPostReactions = await prisma.postReaction.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { post: { userId: { in: userIds } } }
        ]
      }
    });
    console.log(`  ✓ Deleted ${deletedPostReactions.count} post reactions`);

    // Delete comment reactions
    const deletedCommentReactions = await prisma.commentReaction.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { comment: { userId: { in: userIds } } }
        ]
      }
    });
    console.log(`  ✓ Deleted ${deletedCommentReactions.count} comment reactions`);

    // Delete comments
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { post: { userId: { in: userIds } } }
        ]
      }
    });
    console.log(`  ✓ Deleted ${deletedComments.count} comments`);

    // Delete posts
    const deletedPosts = await prisma.post.deleteMany({
      where: {
        userId: { in: userIds }
      }
    });
    console.log(`  ✓ Deleted ${deletedPosts.count} posts`);

    // Delete appointments
    const deletedAppointments = await prisma.appointment.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { counselorId: { in: userIds } }
        ]
      }
    });
    console.log(`  ✓ Deleted ${deletedAppointments.count} appointments`);

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: userIds }
      }
    });
    console.log(`  ✓ Deleted ${deletedUsers.count} users`);

    console.log('\n✅ Test data cleanup complete!\n');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
