const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateReferralCode = require('../utils/generateReferralCode');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function createUniqueReferralCode() {
  let code;
  let exists = true;
  // Retry on the rare chance of a collision
  while (exists) {
    code = generateReferralCode();
    exists = await User.exists({ referralCode: code });
  }
  return code;
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// body: { fullName, email, mobile, password, referredByCode? }
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password, referredByCode } = req.body;

  if (!fullName || !email || !mobile || !password) {
    res.status(400);
    throw new Error('Full name, email, mobile and password are all required');
  }

  const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
  if (existingUser) {
    res.status(409);
    throw new Error('A user with this email or mobile number already exists');
  }

  let referredBy = null;
  if (referredByCode) {
    const sponsor = await User.findOne({ referralCode: referredByCode.trim() });
    if (!sponsor) {
      res.status(400);
      throw new Error('Invalid referral code');
    }
    referredBy = sponsor._id;
  }

  const referralCode = await createUniqueReferralCode();

  const user = await User.create({
    fullName,
    email,
    mobile,
    password,
    referralCode,
    referredBy,
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      token: signToken(user._id),
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.status !== 'Active') {
    res.status(403);
    throw new Error(`Account is ${user.status.toLowerCase()}. Please contact support.`);
  }

  res.json({
    success: true,
    data: {
      user,
      token: signToken(user._id),
    },
  });
});

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { registerUser, loginUser, getMe };
