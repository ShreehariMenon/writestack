const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (u) => jwt.sign({ id: u._id, username: u.username }, process.env.JWT_SECRET, { expiresIn: '14d' });
const safe = (u) => ({ id: u._id, username: u.username, email: u.email, bio: u.bio, avatar: u.avatar, website: u.website, twitter: u.twitter });

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
  if (username.length < 3) return res.status(400).json({ message: 'Username min 3 chars' });
  if (password.length < 6) return res.status(400).json({ message: 'Password min 6 chars' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ message: 'Invalid email' });
  try {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ message: exists.email === email ? 'Email in use' : 'Username taken' });
    const user = await User.create({ username, email, password });
    res.status(201).json({ token: sign(user), user: safe(user) });
  } catch (e) { res.status(500).json({ message: 'Registration failed' }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: sign(user), user: safe(user) });
  } catch { res.status(500).json({ message: 'Login failed' }); }
});

module.exports = router;
