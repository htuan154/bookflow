'use strict';

const { ZodError } = require('zod');

/**
 * Middleware validate body bằng Zod.
 * Dùng: router.post('/ai/suggest', validate(AiSuggestSchema), handler)
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // chỉ cần body cho /ai/suggest
      req.validated = schema.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          code: 400,
          error: 'VALIDATION_ERROR',
          issues: err.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return next(err);
    }
  };
}

module.exports = { validate };
