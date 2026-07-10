function ok(res, data, meta = undefined, status = 200) {
  return res.status(status).json({ success: true, data, meta });
}

function created(res, data) {
  return ok(res, data, undefined, 201);
}

function fail(res, status, message, details = undefined) {
  return res.status(status).json({ success: false, error: { message, details } });
}

module.exports = { ok, created, fail };
