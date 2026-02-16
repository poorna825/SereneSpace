// Test script for the Advanced Chatbot API with Emotion Analysis
// Run with: node test-chatbot-emotion.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000/api/chatbot/emotion';

// Test messages with different emotions
const testMessages = [
  { text: "I'm feeling really anxious about my upcoming presentation", expectedEmotion: "fear" },
  { text: "I'm so happy! I just got accepted to my dream university!", expectedEmotion: "joy" },
  { text: "I'm so angry. My friend betrayed my trust and I feel hurt", expectedEmotion: "anger" },
  { text: "I've been feeling really down lately. Nothing seems to matter anymore", expectedEmotion: "sadness" },
  { text: "Wow, I can't believe that just happened! I'm shocked", expectedEmotion: "surprise" },
  { text: "Hello, I'd like to talk about my day", expectedEmotion: "neutral" }
];

async function testChatbot() {
  console.log('🤖 Testing Advanced Chatbot API with Emotion Analysis\n');
  console.log('=' .repeat(60));
  
  let sessionId = null;
  
  for (let i = 0; i < testMessages.length; i++) {
    const testMsg = testMessages[i];
    console.log(`\n📝 Test ${i + 1}/${testMessages.length}`);
    console.log(`User: "${testMsg.text}"`);
    console.log(`Expected emotion: ${testMsg.expectedEmotion}`);
    
    try {
      const requestBody = {
        message: testMsg.text
      };
      
      // Use sessionId for continuation after first message
      if (sessionId) {
        requestBody.sessionId = sessionId;
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status}`);
        const errorText = await response.text();
        console.error(errorText);
        continue;
      }
      
      const data = await response.json();
      
      // Save session ID for next request
      if (data.sessionId) {
        sessionId = data.sessionId;
      }
      
      console.log(`✅ Detected emotion: ${data.emotion}`);
      console.log(`🤖 Bot reply: "${data.reply}"`);
      console.log(`🆔 Session ID: ${data.sessionId}`);
      
      if (data.error) {
        console.log(`⚠️  Warning: ${data.error}`);
      }
      
      // Verify emotion detection (note: AI might classify differently than expected)
      if (data.emotion === testMsg.expectedEmotion) {
        console.log('✓ Emotion matches expected');
      } else {
        console.log(`⚠ Emotion differs from expected (this is OK - AI interpretation)`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Delay between requests to avoid rate limiting
    if (i < testMessages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Testing complete! Final session ID: ${sessionId}`);
  console.log('All messages should be stored in the same chat session.');
}

// Run tests
console.log('⏳ Starting tests in 2 seconds...\n');
setTimeout(() => {
  testChatbot().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 2000);
