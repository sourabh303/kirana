const ApiError = require('../utils/ApiError');

/**
 * Minimal required-field validator so every module can guard its inputs
 * without pulling in a schema library for this prototype.
 *
 * validateBody(['mobile', 'name']) -> 400 if either is missing/empty.
 */
function validateBody(requiredFields = []) {
  return function (req, res, next) {
    const missing = requiredFields.filter((field) => {
      const value = req.body ? req.body[field] : undefined;
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return next(new ApiError(400, 'Missing required fields', { missing }));
    }
    return next();
  };
}

module.exports = validateBody;
