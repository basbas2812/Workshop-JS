function jsonResponse(res, status, message, data) {
  return res.status(status).json({
    status,
    message,
    data,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    isApprove: user.isApprove,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

((module.exports = jsonResponse), publicUser);
