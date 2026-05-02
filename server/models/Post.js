const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  slug:        { type: String, unique: true },
  subtitle:    { type: String, maxlength: 300, default: '' },
  content:     { type: String, required: true, maxlength: 100000 },
  coverImage:  { type: String, default: '' },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName:  { type: String, required: true },
  tags:        [{ type: String, lowercase: true, trim: true }],
  claps:       { type: Number, default: 0 },
  clappers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views:       { type: Number, default: 0 },
  readTime:    { type: Number, default: 1 },   // minutes
  status:      { type: String, enum: ['draft', 'published'], default: 'published' },
  importedFrom:{ type: String, default: '' },  // source URL if imported
}, { timestamps: true });

// Auto-generate unique slug before save
postSchema.pre('save', async function(next) {
  if (!this.isModified('title')) return next();
  const base = slugify(this.title, { lower: true, strict: true }).slice(0, 60);
  let slug = base;
  let count = 1;
  while (await mongoose.model('Post').findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${count++}`;
  }
  this.slug = slug;

  // Calculate read time (avg 200 wpm)
  const words = this.content.trim().split(/\s+/).length;
  this.readTime = Math.max(1, Math.ceil(words / 200));
  next();
});

postSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);
