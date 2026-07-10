const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const prisma = require('../data/prisma');

/**
 * PRD Section 2: "Users log in using a single authentication system."
 * Validates the JWT and attaches req.user = { id, mobile, roles: string[] }.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }

  prisma.user
    .findUnique({ where: { id: payload.sub }, include: { roles: true } })
    .then((user) => {
      if (!user) return next(new ApiError(401, 'User for this token no longer exists'));
      req.user = { id: user.id, mobile: user.mobile, roles: user.roles.map((r) => r.role) };
      return next();
    })
    .catch(next);
}

module.exports = authenticate;
