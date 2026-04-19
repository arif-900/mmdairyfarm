// ai-agent/src/test.js
// Smoke tests for the Gemini AI Agent
// Run: node src/test.js
// With a real user: TEST_USER_ID=your-uuid node src/test.js

import dotenv from 'dotenv';
dotenv.config();
import { processMessage } from './agent.js';

const UID = process.env.TEST_USER_ID || null;

const TESTS = [
  { label: 'Greeting',                  msg: 'Hello!',                         uid: null },
  { label: 'Products catalog',          msg: 'What products do you sell?',      uid: null },
  { label: 'Delivery info',             msg: 'How far do you deliver?',         uid: null },
  { label: 'Payment methods',           msg: 'Do you accept Cash on Delivery?', uid: null },
  { label: 'Out of scope',              msg: 'What is the capital of India?',   uid: null },
  { label: 'Order history (auth)',      msg: 'Show me my orders',               uid: UID  },
  { label: 'Latest order (auth)',       msg: 'What is my latest order?',        uid: UID  },
  { label: 'Second order (auth)',       msg: 'What was my second order?',       uid: UID  },
  { label: 'Product search (auth)',     msg: 'Did I ever order cow milk?',      uid: UID  },
  { label: 'Guest asks for orders',     msg: 'Show me my orders',               uid: null },
];

async function run() {
  console.log('🧪 MM Dairy Farm AI Agent — Gemini Test Suite');
  console.log(`   userId: ${UID || '(none — guest mode)'}`);
  console.log('─'.repeat(60));

  let pass = 0, fail = 0;

  for (const t of TESTS) {
    process.stdout.write(`\n📋 ${t.label}\n   msg: "${t.msg}"\n`);
    try {
      const { reply, toolsUsed } = await processMessage(t.msg, t.uid, []);
      console.log(`   tools: [${toolsUsed.join(', ') || 'none'}]`);
      console.log(`   reply: "${reply.slice(0, 120)}${reply.length > 120 ? '…' : ''}"`);
      console.log('   ✅ PASS');
      pass++;
    } catch (err) {
      console.log(`   ❌ FAIL — ${err.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊  ${pass} passed | ${fail} failed | ${TESTS.length} total`);
  if (!fail) console.log('🎉  All tests passed!\n');
}

run().catch(console.error);
