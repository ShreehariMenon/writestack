const router = require('express').Router();
const Post = require('../models/Post');

// Get trending tags with post counts
router.get('/', async (req, res) => {
  try {
    const result = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json(result.map(r => ({ tag: r._id, count: r.count })));
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
