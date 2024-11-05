const checkPermissions = (requestUser, resourceUserId) => {
  // must convert resourceUserId from object to string
  if (requestUser.userId === resourceUserId.toString()) return;

  return res.status(401).json({
    success: false,
    message: "Not authorized to access this route",
  });
};

export default checkPermissions;
