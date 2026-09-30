/**
 * Restrict access to specific roles.
 * Must be used after protect middleware.
 *
 * Example: authorize('admin')
 * Example: authorize('seller', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error('Not authorized. Please log in.'));
  }

  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(
      new Error(`Access denied. Requires one of: ${roles.join(', ')}`)
    );
  }

  return next();
};

module.exports = { authorize };
