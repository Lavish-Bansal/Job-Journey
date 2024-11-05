import { User } from "../models/user.js";

// Register user
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // checking for existed email
    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User with email is already present",
      });
    }

    const user = await User.create({ name, email, password });
    const token = user.createJWT();

    // sending everything but the password
    res.status(200).json({
      user: {
        email: user.email,
        name: user.name,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  const token = user.createJWT();
  user.password = undefined; // so that it won't be sent in the response

  res.status(200).json({ user, token, location: user.location });
};

// Update User
const updateUser = async (req, res) => {
  const { email, name, lastName, location } = req.body;
  if (!email || !name || !lastName || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const user = await User.findOne({ _id: req.user.userId }); // from auth-middleware

  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;

  await user.save();

  const token = user.createJWT(); // not required but preferred

  res.status(200).json({ user, token, location: user.location });
};

export { register, login, updateUser };
