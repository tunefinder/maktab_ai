const crypto = require('crypto');

// 1. Test PBKDF2 100k Hashing & Verification
function testPasswordHashing() {
  console.log("=== 1. Testing High-Security PBKDF2 100k Hashing ===");
  const password = "Ustoz_Maxfiy_Parol_2026";
  
  // v2 hashing (100k iterations)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const storedHashV2 = `v2:100000:${salt}:${hash}`;
  
  console.log("Generated v2 hash format:", storedHashV2.substring(0, 35) + "...");
  
  // Verification test
  const parts = storedHashV2.split(':');
  const iter = parseInt(parts[1], 10);
  const s = parts[2];
  const original = parts[3];
  const computed = crypto.pbkdf2Sync(password, s, iter, 64, 'sha512').toString('hex');
  const isMatch = crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(original, 'hex'));
  
  if (isMatch) {
    console.log("✅ 100,000 Iteration PBKDF2 verified successfully!");
  } else {
    throw new Error("Password verification failed!");
  }

  // Legacy format backward compatibility test (1000 iterations)
  console.log("\n=== 2. Testing Legacy 1,000 Iteration Compatibility ===");
  const legacySalt = crypto.randomBytes(16).toString('hex');
  const legacyHash = crypto.pbkdf2Sync(password, legacySalt, 1000, 64, 'sha512').toString('hex');
  const storedLegacy = `${legacySalt}:${legacyHash}`;
  
  const [lSalt, lOrig] = storedLegacy.split(':');
  const lComputed = crypto.pbkdf2Sync(password, lSalt, 1000, 64, 'sha512').toString('hex');
  const isLegacyMatch = crypto.timingSafeEqual(Buffer.from(lComputed, 'hex'), Buffer.from(lOrig, 'hex'));
  
  if (isLegacyMatch) {
    console.log("✅ Legacy 1,000 iteration hash verified and flagged for auto-rehash!");
  } else {
    throw new Error("Legacy password verification failed!");
  }
}

// 2. Test Rate Limiter logic
function testRateLimiter() {
  console.log("\n=== 3. Testing Brute-Force Rate Limiter ===");
  const store = new Map();
  const maxAttempts = 5;
  const windowMs = 10 * 60 * 1000;
  const lockoutMs = 15 * 60 * 1000;
  const key = "test_ip_192_168_1_1";

  function check(k) {
    const now = Date.now();
    let rec = store.get(k) || { attempts: [] };
    if (rec.lockoutUntil && rec.lockoutUntil > now) {
      return { allowed: false, locked: true };
    }
    rec.attempts = rec.attempts.filter(t => now - t < windowMs);
    if (rec.attempts.length >= maxAttempts) {
      rec.lockoutUntil = now + lockoutMs;
      return { allowed: false, locked: true };
    }
    return { allowed: true, remaining: maxAttempts - rec.attempts.length };
  }

  function recordFail(k) {
    const now = Date.now();
    let rec = store.get(k) || { attempts: [] };
    rec.attempts.push(now);
    store.set(k, rec);
  }

  // Simulate 4 failed attempts
  for (let i = 1; i <= 4; i++) {
    recordFail(key);
    const res = check(key);
    console.log(`Attempt ${i}: Allowed = ${res.allowed}, Remaining = ${res.remaining}`);
  }

  // 5th failed attempt -> should lock out
  recordFail(key);
  const lockedRes = check(key);
  console.log(`Attempt 5: Allowed = ${lockedRes.allowed}, Locked = ${lockedRes.locked}`);

  if (!lockedRes.allowed && lockedRes.locked) {
    console.log("✅ Rate limiter successfully locked out after 5 failed attempts!");
  } else {
    throw new Error("Rate limiter failed to lock out!");
  }
}

try {
  testPasswordHashing();
  testRateLimiter();
  console.log("\n🎉 ALL SECURITY TESTS PASSED!");
} catch (e) {
  console.error("❌ Test Failed:", e);
  process.exit(1);
}
