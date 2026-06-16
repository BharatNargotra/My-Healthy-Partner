import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import protect from '../middleware/auth.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);

    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // select: false on password field — must explicitly select it
    const user = await User.findOne({ email }).select('+password');

    console.log("LOGIN EMAIL:", email);
    console.log("USER FOUND:", user ? user.email : "NO USER");
    console.log("STORED PASSWORD:", user ? user.password : "NO PASSWORD");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
  console.error('LOGIN ERROR:', err);

  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}
});

// GET /api/auth/me  (protected)
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/change-password  (protected)
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: 'Both passwords required' });

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(oldPassword)))
      return res.status(400).json({ message: 'Old password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
  console.error('REGISTER ERROR:', err);

  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}
});

// DELETE /api/auth/delete  (protected)
router.delete('/delete', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
  console.error('REGISTER ERROR:', err);

  res.status(500).json({
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}
});

export default router;
