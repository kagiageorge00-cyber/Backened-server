const mongoose = require('mongoose');

const jobBookmarkSchema = new mongoose.Schema(
  {
    employerId: { type: String, required: true, index: true, trim: true },
    jobId: { type: String, required: true, index: true, trim: true },
    saved: { type: Boolean, default: false },
    shortlisted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

jobBookmarkSchema.index({ employerId: 1, jobId: 1 }, { unique: true });

module.exports =
  mongoose.models.JobBookmark || mongoose.model('JobBookmark', jobBookmarkSchema);
