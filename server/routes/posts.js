const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

const LIMIT = 12;

// ── Public feed ─────────────────────────────────────────────────
router.get('/', auth.optional, async (req, res) => {
  const { search, tag, skip = 0, sort = 'latest' } = req.query;
  const query = { status: 'published' };
  if (tag) query.tags = tag.toLowerCase();
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { tags: { $regex: search, $options: 'i' } },
  ];
  const sortObj = sort === 'popular' ? { claps: -1, views: -1 } : { createdAt: -1 };
  try {
    const [posts, total] = await Promise.all([
      Post.find(query).sort(sortObj).skip(+skip).limit(LIMIT)
        .select('title slug subtitle coverImage authorName author tags claps views readTime createdAt status'),
      Post.countDocuments(query)
    ]);
    res.json({ posts, hasMore: +skip + LIMIT < total, total });
  } catch { res.status(500).json({ message: 'Failed to fetch posts' }); }
});

// ── Following feed ───────────────────────────────────────────────
router.get('/following', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('following');
  const { skip = 0 } = req.query;
  try {
    const [posts, total] = await Promise.all([
      Post.find({ author: { $in: user.following }, status: 'published' })
        .sort({ createdAt: -1 }).skip(+skip).limit(LIMIT)
        .select('title slug subtitle coverImage authorName author tags claps views readTime createdAt'),
      Post.countDocuments({ author: { $in: user.following }, status: 'published' })
    ]);
    res.json({ posts, hasMore: +skip + LIMIT < total });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ── User's own posts (dashboard) ─────────────────────────────────
router.get('/mine', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .select('title slug status tags claps views readTime createdAt');
    res.json(posts);
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ── Single post by slug ──────────────────────────────────────────
router.get('/:slug', auth.optional, async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'username bio avatar followers');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // increment views (fire and forget)
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec();
    const isClapped = req.user ? post.clappers.includes(req.user.id) : false;
    const isBookmarked = req.user
      ? !!(await User.findOne({ _id: req.user.id, bookmarks: post._id }))
      : false;
    const isFollowing = req.user
      ? !!(await User.findOne({ _id: req.user.id, following: post.author._id }))
      : false;
    res.json({ ...post.toObject(), isClapped, isBookmarked, isFollowing });
  } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// ── Create post ──────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { title, content, subtitle, coverImage, tags, status } = req.body;
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: 'Title and content required' });
  try {
    const user = await User.findById(req.user.id).select('username');
    const post = await Post.create({
      title: title.trim(), content: content.trim(),
      subtitle: subtitle?.trim() || '',
      coverImage: coverImage?.trim() || '',
      tags: (tags || []).slice(0, 5).map(t => t.toLowerCase().trim()).filter(Boolean),
      author: req.user.id,
      authorName: user.username,
      status: status || 'published',
    });
    res.status(201).json(post);
  } catch (e) { res.status(500).json({ message: e.message || 'Failed to create' }); }
});

// ── Update post ──────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const { title, content, subtitle, coverImage, tags, status } = req.body;
    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    post.subtitle = subtitle?.trim() || post.subtitle;
    post.coverImage = coverImage?.trim() || post.coverImage;
    if (tags) post.tags = tags.slice(0, 5).map(t => t.toLowerCase().trim()).filter(Boolean);
    if (status) post.status = status;
    await post.save();
    res.json(post);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Delete post ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await post.deleteOne();
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ── Clap ─────────────────────────────────────────────────────────
router.post('/:id/clap', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    const uid = req.user.id;
    const already = post.clappers.some(c => c.toString() === uid);
    if (already) {
      post.clappers = post.clappers.filter(c => c.toString() !== uid);
      post.claps = Math.max(0, post.claps - 1);
    } else {
      post.clappers.push(uid);
      post.claps += 1;
    }
    await post.save();
    res.json({ claps: post.claps, isClapped: !already });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// ── Bookmark ─────────────────────────────────────────────────────
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const pid = req.params.id;
    const idx = user.bookmarks.findIndex(b => b.toString() === pid);
    if (idx > -1) user.bookmarks.splice(idx, 1);
    else user.bookmarks.push(pid);
    await user.save();
    res.json({ bookmarked: idx === -1 });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
