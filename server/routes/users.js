const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Get user profile by username
router.get('/:username', auth.optional, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -bookmarks');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const posts = await Post.find({ author: user._id, status: 'published' })
      .sort({ createdAt: -1 })
      .select('title slug subtitle coverImage tags claps views readTime createdAt');
    const isFollowing = req.user
      ? !!(await User.findOne({ _id: req.user.id, following: user._id }))
      : false;
    res.json({
      user: { ...user.toObject(), followerCount: user.followers.length, followingCount: user.following.length },
      posts,
      isFollowing,
    });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Follow / unfollow
router.post('/:id/follow', auth, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ message: "Can't follow yourself" });
  try {
    const [me, target] = await Promise.all([
      User.findById(req.user.id),
      User.findById(req.params.id),
    ]);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const already = me.following.some(f => f.toString() === req.params.id);
    if (already) {
      me.following = me.following.filter(f => f.toString() !== req.params.id);
      target.followers = target.followers.filter(f => f.toString() !== req.user.id);
    } else {
      me.following.push(req.params.id);
      target.followers.push(req.user.id);
    }
    await Promise.all([me.save(), target.save()]);
    res.json({ following: !already, followerCount: target.followers.length });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Update profile
router.put('/me/profile', auth, async (req, res) => {
  const { bio, avatar, website, twitter } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, avatar, website, twitter },
      { new: true, select: '-password' }
    );
    res.json(user);
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Get bookmarks
router.get('/me/bookmarks', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'bookmarks',
      select: 'title slug subtitle coverImage authorName tags claps readTime createdAt',
    });
    res.json(user.bookmarks);
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
