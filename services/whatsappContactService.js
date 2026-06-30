/**
 * WhatsApp Contact Management Service
 * Handles contact CRUD, validation, deduplication, and bulk operations
 */

const WhatsAppContact = require('../models/WhatsAppContact');
const WhatsAppOptOut = require('../models/WhatsAppOptOut');
// libphonenumber-js ships with CJS entry files but some installs lack package.json
// so require the CJS entry directly to ensure runtime resolution works.
let libphonenumber;
try {
  libphonenumber = require('libphonenumber-js/index.cjs');
} catch (err) {
  libphonenumber = null;
}

// Fallback lightweight parser when libphonenumber-js cannot be resolved at runtime
function parsePhoneNumberFallback(phoneNumber, defaultCountry = 'KE') {
  if (!phoneNumber || typeof phoneNumber !== 'string') return null;
  const cleaned = phoneNumber.trim();
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return null;

  // Basic E.164 guess: prefer existing + prefix, otherwise prefix with country dial code if known
  const countryDial = { KE: '254', US: '1' }[defaultCountry] || '';
  let e164 = null;
  if (cleaned.startsWith('+')) {
    e164 = '+' + digits;
  } else if (countryDial && digits.length <= 12) {
    const local = digits.replace(/^0+/, '');
    e164 = '+' + countryDial + local;
  } else {
    e164 = '+' + digits;
  }

  return {
    formatInternational: () => e164,
    format: () => e164,
    country: defaultCountry,
    number: e164,
  };
}

function isValidPhoneNumberFallback(parsed) {
  if (!parsed || !parsed.number) return false;
  const digits = parsed.number.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Validate and normalize international phone number
 * @param {string} phoneNumber - Raw phone number
 * @param {string} defaultCountry - Default country code (e.g., 'US', 'KE')
 * @returns {Object} { isValid, number, formatted, error }
 */
function validatePhoneNumber(phoneNumber, defaultCountry = 'KE') {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return { isValid: false, error: 'Phone number must be a non-empty string' };
    }
    // Parse and validate using libphonenumber-js when available
    let parsed;
    let isValid = false;

    if (libphonenumber) {
      try {
        parsed =
          libphonenumber.parsePhoneNumber?.(phoneNumber, defaultCountry) ||
          libphonenumber.parsePhoneNumberFromString?.(phoneNumber, defaultCountry) ||
          libphonenumber.parse?.(phoneNumber, defaultCountry);

        if (!parsed) {
          return { isValid: false, error: 'Invalid phone number format' };
        }

        isValid =
          libphonenumber.isValidPhoneNumber?.(parsed) ||
          libphonenumber.isValidPhoneNumber?.(phoneNumber, defaultCountry) ||
          libphonenumber.isValid?.(parsed) || false;
      } catch (err) {
        // fall through to fallback
        parsed = null;
        isValid = false;
      }
    }

    // Use fallback parser when libphonenumber-js isn't usable
    if (!parsed) {
      parsed = parsePhoneNumberFallback(phoneNumber, defaultCountry);
      isValid = isValidPhoneNumberFallback(parsed);
    }

    if (!isValid) {
      return { isValid: false, error: 'Invalid phone number' };
    }

    // Return in E.164 format (e.g., +254712345678)
    const formatted = parsed.formatInternational ? parsed.formatInternational() : parsed.format();
    const e164 = (parsed.format && typeof parsed.format === 'function') ? parsed.format('E.164') : formatted;

    return {
      isValid: true,
      number: e164,
      formatted,
      country: parsed.country || defaultCountry,
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

/**
 * Create or update a single contact
 * @param {Object} contactData - { fullName, phoneNumber, source, tags }
 * @returns {Promise<Object>} Created/updated contact
 */
async function createOrUpdateContact(contactData) {
  try {
    const { fullName, phoneNumber, source = 'manual', tags = [] } = contactData;

    // Validate phone number
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      throw new Error(`Invalid phone number: ${validation.error}`);
    }

    // Check if contact already exists (by normalized phone)
    let contact = await WhatsAppContact.findOne({ phoneNumber: validation.number });

    if (contact) {
      // Update existing contact
      contact.fullName = fullName || contact.fullName;
      contact.tags = [...new Set([...contact.tags, ...tags])]; // Merge tags
      contact.source = source;
      await contact.save();
      return { contact, isNew: false };
    } else {
      // Create new contact
      contact = new WhatsAppContact({
        fullName: fullName || '',
        phoneNumber: validation.number,
        source,
        tags,
        optedIn: true,
        optedOut: false,
      });
      await contact.save();
      return { contact, isNew: true };
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk import contacts with deduplication
 * @param {Array} contacts - Array of contact objects
 * @param {Array} tags - Tags to apply to all contacts
 * @returns {Promise<Object>} Import statistics
 */
async function bulkImportContacts(contacts, tags = []) {
  const results = {
    total: contacts.length,
    successful: 0,
    duplicates: 0,
    invalid: 0,
    newContactsCreated: 0,
    existingUpdated: 0,
    errors: [],
  };

  const seenPhoneNumbers = new Set();

  for (let i = 0; i < contacts.length; i++) {
    try {
      const contact = contacts[i];
      const validation = validatePhoneNumber(contact.phoneNumber);

      if (!validation.isValid) {
        results.invalid++;
        results.errors.push({
          rowNumber: i + 1,
          phoneNumber: contact.phoneNumber,
          reason: validation.error,
        });
        continue;
      }

      // Check for duplicates within the import batch
      if (seenPhoneNumbers.has(validation.number)) {
        results.duplicates++;
        continue;
      }
      seenPhoneNumbers.add(validation.number);

      // Import the contact
      const { contact: savedContact, isNew } = await createOrUpdateContact({
        fullName: contact.fullName || '',
        phoneNumber: validation.number,
        source: contact.source || 'bulk_import',
        tags: [...(contact.tags || []), ...tags],
      });

      results.successful++;
      if (isNew) {
        results.newContactsCreated++;
      } else {
        results.existingUpdated++;
      }
    } catch (error) {
      results.invalid++;
      results.errors.push({
        rowNumber: i + 1,
        phoneNumber: contacts[i].phoneNumber,
        reason: error.message,
      });
    }
  }

  return results;
}

/**
 * Get contacts by filter
 * @param {Object} filter - MongoDB filter
 * @param {Object} options - { page, limit, sort }
 * @returns {Promise<Object>} Paginated contacts
 */
async function getContacts(filter = {}, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  const contacts = await WhatsAppContact.find(filter)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await WhatsAppContact.countDocuments(filter);

  return {
    contacts,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get contacts by tags
 * @param {Array} tags - Array of tags
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Contacts with those tags
 */
async function getContactsByTags(tags, options = {}) {
  return getContacts({ tags: { $in: tags } }, options);
}

/**
 * Get active (opted-in) contacts
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Active contacts
 */
async function getActiveContacts(options = {}) {
  return getContacts({ optedOut: false, optedIn: true }, options);
}

/**
 * Get opted-out contacts
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Opted-out contacts
 */
async function getOptedOutContacts(options = {}) {
  return getContacts({ optedOut: true }, options);
}

/**
 * Mark contact as opted-out
 * @param {string} phoneNumber - Phone number
 * @param {string} reason - Opt-out reason
 * @param {string} message - Message that triggered opt-out
 * @returns {Promise<Object>} Updated contact and opt-out record
 */
async function markContactAsOptedOut(phoneNumber, reason = 'MANUAL', message = '') {
  try {
    // Normalize phone number
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      throw new Error('Invalid phone number format');
    }

    const normalizedPhone = validation.number;

    // Update contact
    const contact = await WhatsAppContact.findOneAndUpdate(
      { phoneNumber: normalizedPhone },
      { optedOut: true, optedIn: false, updatedAt: new Date() },
      { new: true }
    );

    // Create opt-out record
    const optOut = await WhatsAppOptOut.findOneAndUpdate(
      { phoneNumber: normalizedPhone },
      {
        phoneNumber: normalizedPhone,
        contactId: contact?._id || null,
        fullName: contact?.fullName || '',
        optOutReason: reason,
        optOutMessage: message,
        optOutDetectionMethod: 'automatic',
        source: 'webhook',
      },
      { upsert: true, new: true }
    );

    return { contact, optOut };
  } catch (error) {
    throw error;
  }
}

/**
 * Remove duplicate phone numbers
 * Keeps the most recent, merges tags
 * @returns {Promise<Object>} Deduplication results
 */
async function removeDuplicates() {
  try {
    const result = {
      duplicatesFound: 0,
      contactsMerged: 0,
      tagsPreserved: 0,
    };

    // Find duplicates
    const duplicates = await WhatsAppContact.aggregate([
      { $group: { _id: '$phoneNumber', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    result.duplicatesFound = duplicates.length;

    // Process each duplicate group
    for (const dup of duplicates) {
      const contacts = await WhatsAppContact.find({ _id: { $in: dup.ids } }).sort({ createdAt: -1 });

      // Keep the most recent, merge others' data
      const primary = contacts[0];
      let allTags = [...primary.tags];

      for (let i = 1; i < contacts.length; i++) {
        allTags = [...new Set([...allTags, ...contacts[i].tags])];
      }

      primary.tags = allTags;
      await primary.save();

      // Delete duplicates
      const idsToDelete = dup.ids.filter(id => !id.equals(primary._id));
      await WhatsAppContact.deleteMany({ _id: { $in: idsToDelete } });

      result.contactsMerged += idsToDelete.length;
      result.tagsPreserved += allTags.length;
    }

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Search contacts
 * @param {string} query - Search query (name or phone)
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Matching contacts
 */
async function searchContacts(query, options = {}) {
  const searchFilter = {
    $or: [
      { fullName: { $regex: query, $options: 'i' } },
      { phoneNumber: { $regex: query.replace(/\D/g, ''), $options: 'i' } },
    ],
  };

  return getContacts(searchFilter, options);
}

/**
 * Delete a contact
 * @param {string} contactId - Contact ID
 * @returns {Promise<Object>} Deleted contact
 */
async function deleteContact(contactId) {
  const contact = await WhatsAppContact.findByIdAndDelete(contactId);
  if (!contact) {
    throw new Error('Contact not found');
  }
  return contact;
}

/**
 * Add tags to contacts
 * @param {Array} contactIds - Contact IDs
 * @param {Array} tags - Tags to add
 * @returns {Promise<Object>} Update result
 */
async function addTagsToContacts(contactIds, tags) {
  const result = await WhatsAppContact.updateMany(
    { _id: { $in: contactIds } },
    { $addToSet: { tags: { $each: tags } } }
  );
  return result;
}

/**
 * Remove tags from contacts
 * @param {Array} contactIds - Contact IDs
 * @param {Array} tags - Tags to remove
 * @returns {Promise<Object>} Update result
 */
async function removeTagsFromContacts(contactIds, tags) {
  const result = await WhatsAppContact.updateMany(
    { _id: { $in: contactIds } },
    { $pullAll: { tags } }
  );
  return result;
}

/**
 * Get contact statistics
 * @returns {Promise<Object>} Statistics
 */
async function getContactStatistics() {
  const totalContacts = await WhatsAppContact.countDocuments();
  const activeContacts = await WhatsAppContact.countDocuments({ optedOut: false });
  const optedOutContacts = await WhatsAppContact.countDocuments({ optedOut: true });
  
  const topTags = await WhatsAppContact.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    totalContacts,
    activeContacts,
    optedOutContacts,
    inactivePercentage: ((optedOutContacts / totalContacts) * 100).toFixed(2),
    topTags,
  };
}

module.exports = {
  validatePhoneNumber,
  createOrUpdateContact,
  bulkImportContacts,
  getContacts,
  getContactsByTags,
  getActiveContacts,
  getOptedOutContacts,
  markContactAsOptedOut,
  removeDuplicates,
  searchContacts,
  deleteContact,
  addTagsToContacts,
  removeTagsFromContacts,
  getContactStatistics,
};
