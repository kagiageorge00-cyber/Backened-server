const crypto = require('crypto');

class AuthRepository {
  constructor(store) {
    this.store = store;
  }

  async findUserByIdentifier(identifier, model) {
    const normalized = String(identifier || '').trim();
    if (!normalized) return null;
    const search = [];
    const lower = normalized.toLowerCase();
    if (normalized.startsWith('BLISS-')) search.push({ blissId: normalized });
    if (normalized.startsWith('CAND-')) search.push({ candidateId: normalized });
    search.push({ email: lower }, { phone: normalized });
    return model.findOne({ $or: search });
  }

  async createUser(model, payload) {
    return model.create(payload);
  }

  async createVerificationToken(model, payload) {
    return model.create(payload);
  }

  async createOtp(model, payload) {
    return model.create(payload);
  }

  async updateUser(model, id, changes) {
    return model.findByIdAndUpdate(id, changes, { new: true });
  }

  async createLoginRecord(model, payload) {
    return model.create(payload);
  }

  async findCandidateByIdentifier(model, identifier) {
    const normalized = String(identifier || '').trim();
    if (!normalized) return null;
    const lower = normalized.toLowerCase();
    return model.findOne({
      $or: [
        { uniqueCode: normalized },
        { candidateId: normalized },
        { email: lower },
        { phone: normalized },
      ],
    });
  }

  async createTokenHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = AuthRepository;
