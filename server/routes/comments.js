const router = require('express').Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Get comments for a post
router.get('/:postId', auth.optional, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .lean();
    // Build tree: top-level + replies
    const top = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);
    top.forEach(c => {
      c.replies = replies.filter(r => r.parentId?.toString() === c._id.toString());
      c.likeCount = c.likes?.length || 0;
      c.isLiked = req.user ? c.likes?.some(l => l.toString() === req.user.id) : false;
    });
    res.json(top);
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Add comment or reply
router.post('/', auth, async (req, res) => {
  const { postId, content, parentId } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
  try {
    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      authorName: req.user.username,
      content: content.trim(),
      parentId: parentId || null,
    });
    res.status(201).json({ ...comment.toObject(), replies: [], likeCount: 0, isLiked: false });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Like / unlike a comment
router.post('/:id/like', auth, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    const uid = req.user.id;
    const idx = c.likes.findIndex(l => l.toString() === uid);
    if (idx > -1) c.likes.splice(idx, 1);
    else c.likes.push(uid);
    await c.save();
    res.json({ likeCount: c.likes.length, isLiked: idx === -1 });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    if (c.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await c.deleteOne();
    // Also delete replies
    await Comment.deleteMany({ parentId: c._id });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
