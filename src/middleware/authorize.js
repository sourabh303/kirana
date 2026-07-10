const ApiError = require('../utils/ApiError');

/**
 * PRD Section 2 — API Level:
 * "Every API validates the user's role and permissions before processing a
 * request. Unauthorized requests are rejected even if someone attempts to
 * bypass the user interface."
 *
 * Usage: authorize('shopkeeper', 'super_admin')
 * A user needs at least one of the listed roles (users may hold multiple
 * roles per PRD Section 3).
 */
function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const hasAccess = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasAccess) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action', {
          required: allowedRoles,
          have: req.user.roles,
        })
      );
    }

    return next();
  };
}

module.exports = authorize;
