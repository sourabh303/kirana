const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../../data/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../config/roles');

const OTP_TTL_MS = 5 * 60 * 1000;

function signToken(user) {
  const roles = user.roles
    ? user.roles.map((r) => (typeof r === 'string' ? r : r.role))
    : [];
  return jwt.sign({ sub: user.id, roles }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// PRD 6: "Mobile number with OTP verification" — mocked for the prototype.
async function requestOtp(mobile) {
  if (!mobile) throw new ApiError(400, 'mobile is required');

  const code = process.env.OTP_STATIC_DEV_CODE || '123456';
  await prisma.otp.create({
    data: {
      mobile,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  // In production this dispatches through the Notifications module (SMS channel).
  return { mobile, expiresInSeconds: OTP_TTL_MS / 1000, devHint: `Use code ${code} in this prototype` };
}

async function verifyOtp(mobile, code) {
  const otp = await prisma.otp.findFirst({
    where: { mobile, code, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw new ApiError(400, 'Invalid or expired OTP');
  await prisma.otp.delete({ where: { id: otp.id } });
  return true;
}

async function register({ mobile, name, email, password, otpCode, roles }) {
  const existing = await prisma.user.findUnique({ where: { mobile } });
  if (existing) throw new ApiError(409, 'A user with this mobile number already exists');

  await verifyOtp(mobile, otpCode);

  const assignedRoles = roles && roles.length ? roles : [ROLES.CUSTOMER];
  const invalid = assignedRoles.filter((r) => !Object.values(ROLES).includes(r));
  if (invalid.length) throw new ApiError(400, 'Unknown role(s)', { invalid });

  const user = await prisma.user.create({
    data: {
      mobile,
      name,
      email: email || null,
      passwordHash: password ? bcrypt.hashSync(password, 8) : null,
      roles: { create: assignedRoles.map((role) => ({ role })) },
    },
    include: { roles: true, addresses: true },
  });

  return { user: sanitize(user), token: signToken(user) };
}

async function loginWithOtp({ mobile, otpCode }) {
  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { roles: true, addresses: true },
  });
  if (!user) throw new ApiError(404, 'No account found for this mobile number');
  await verifyOtp(mobile, otpCode);
  return { user: sanitize(user), token: signToken(user) };
}

async function loginWithPassword({ mobile, password }) {
  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { roles: true, addresses: true },
  });
  if (!user || !user.passwordHash) throw new ApiError(401, 'Invalid credentials');
  const match = bcrypt.compareSync(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'Invalid credentials');
  return { user: sanitize(user), token: signToken(user) };
}

/**
 * Google OAuth — find or create user by googleId / email.
 */
async function loginWithGoogle({ googleId, email, name }) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    include: { roles: true, addresses: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        mobile: `google_${googleId}`, // placeholder; prompt user to add mobile later
        googleId,
        email,
        name,
        roles: { create: [{ role: ROLES.CUSTOMER }] },
      },
      include: { roles: true, addresses: true },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId },
      include: { roles: true, addresses: true },
    });
  }

  return { user: sanitize(user), token: signToken(user) };
}

function sanitize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = { requestOtp, verifyOtp, register, loginWithOtp, loginWithPassword, loginWithGoogle, sanitize };
