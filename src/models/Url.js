const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
    validate: {
      validator: function(url) {
        // Basic URL validation
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

urlSchema.index({ shortId: 1 }, { unique: true });
urlSchema.index({ createdAt: -1 });
urlSchema.methods.incrementClickCount = function() {
  return this.constructor.findOneAndUpdate(
    { _id: this._id },
    { $inc: { clickCount: 1 } },
    { new: true }
  );
};

urlSchema.statics.findByShortId = function(shortId) {
  return this.findOne({ shortId });
};

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;