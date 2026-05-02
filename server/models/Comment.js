const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  content:    { type: String, required: true, maxlength: 2000 },
  parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
