const crypto = require('crypto');

/**
 * Generates a short, human-friendly, unique-ish referral code.
 * Uniqueness is finally enforced by the unique index on User.referralCode,
 * with a retry loop at the call site if a collision occurs.
 */
function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars (0/O, 1/I)
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

module.exports = generateReferralCode;
