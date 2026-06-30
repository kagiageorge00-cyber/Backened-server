const mongoose = require('mongoose');

/**
 * WhatsApp Contact Import History
 * Tracks bulk imports and provides audit trail
 */
const whatsappImportHistorySchema = new mongoose.Schema({
  importName: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'partial'],
    default: 'processing',
    index: true,
  },
  
  // File information
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 }, // bytes
  fileType: { type: String, enum: ['csv', 'xlsx'], required: true },
  
  // Import statistics
  totalRecords: { type: Number, default: 0 },
  successfulImports: { type: Number, default: 0 },
  duplicatesSkipped: { type: Number, default: 0 },
  invalidRecords: { type: Number, default: 0 },
  newContactsCreated: { type: Number, default: 0 },
  existingContactsUpdated: { type: Number, default: 0 },
  
  // Error tracking
  errors: [{
    rowNumber: Number,
    phoneNumber: String,
    reason: String,
  }],
  
  // User information
  importedBy: { type: String, default: 'admin' },
  importedByUserId: { type: mongoose.Schema.Types.ObjectId, default: null },
  
  // Tags and metadata
  appliedTags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  
  // Timestamps
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes
whatsappImportHistorySchema.index({ status: 1 });
whatsappImportHistorySchema.index({ createdAt: -1 });
whatsappImportHistorySchema.index({ importedBy: 1 });

// Auto-update timestamp
whatsappImportHistorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('WhatsAppImportHistory', whatsappImportHistorySchema);
