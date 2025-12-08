const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
    validate: {
      validator: function(url) {
        // Basic URL validation - checks for valid URL format
        try {
          new URL(url);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Please provide a valid URL'
    }
  },
  shortId: {
    type: String,
    required: [true, 'Short ID is required'],
    unique: true,
    trim: true,
    minlength: [1, 'Short ID cannot be empty'],
    maxlength: [50, 'Short ID cannot exceed 50 characters']
  },
  clickCount: {
    type: Number,
    default: 0,
    min: [0, 'Click count cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create unique index on shortId field for fast lookups
urlSchema.index({ shortId: 1 }, { unique: true });

// Create index on createdAt field for analytics queries
urlSchema.index({ createdAt: -1 });

// Add a method to increment click count atomically
urlSchema.methods.incrementClickCount = function() {
  return this.constructor.findOneAndUpdate(
    { _id: this._id },
    { $inc: { clickCount: 1 } },
    { new: true }
  );
};

// Static method to find by shortId
urlSchema.statics.findByShortId = function(shortId) {
  return this.findOne({ shortId });
};

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;