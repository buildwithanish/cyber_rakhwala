export const attachRequestContext = (req, _res, next) => {
  req.context = {
    requestId: req.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? 'unknown'
  };

  next();
};
