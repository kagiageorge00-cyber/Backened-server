const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const BlissCommunicationUser = require('../models/BlissCommunicationUser');
const Candidate = require('../models/candidate');
const PushToken = require('../models/PushToken');
const { buildBlissId, isValidBlissAppPasswordHash } = require('../auth/services/authService');
const {
  buildConversationId,
  mapConversation,
  mapMessage,
  normalizeIdentifier,
  normalizePhone,
} = require('../utils/blissAppMigration');

const USAGE = [
  'Usage: node scripts/migrate_bliss_app_data.js [--apply]',
  '',
  'Dry-run is the default. Set BLISS_APP_MONGO_URI to the source backend URI',
  'and MONGO_URI or MONGODB_URI to the Bliss Connect destination URI.',
  'Pass --apply to write records. The migration never deletes source records.',
].join('\n');

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function createSummary() {
  return {
    users: { scanned: 0, created: 0, matched: 0, skipped: 0, conflicts: 0 },
    candidates: { scanned: 0, created: 0, matched: 0, skipped: 0, conflicts: 0 },
    conversations: { scanned: 0, created: 0, matched: 0, skipped: 0 },
    messages: { scanned: 0, created: 0, matched: 0, skipped: 0 },
    deviceTokens: { scanned: 0, created: 0, matched: 0, skipped: 0 },
  };
}

function addAliases(aliasMap, values, blissId) {
  for (const value of values) {
    const alias = normalizeIdentifier(value);
    if (alias) aliasMap.set(alias, blissId);
  }
}

function accountProfile(account, sourceId) {
  const email = String(account.email || '').trim().toLowerCase();
  const fullName = String(account.fullName || '').trim();
  const rawPhone = String(account.phone || '').trim();
  const phone = normalizePhone(rawPhone) || `pending-bliss-app-${sourceId}`;
  const authProvider = String(account.authProvider || 'password').toLowerCase();
  const legacyPasswordHash =
    authProvider !== 'google' && isValidBlissAppPasswordHash(account.passwordHash)
      ? account.passwordHash
      : undefined;

  if (!sourceId || !isEmail(email) || fullName.length < 2) return null;
  if (authProvider !== 'google' && !legacyPasswordHash) return null;

  return {
    legacyBlissAppId: sourceId,
    legacyPasswordHash,
    blissId: '',
    fullName,
    email,
    phone,
    whatsapp: normalizePhone(account.whatsapp) || '',
    location: String(account.location || '').trim(),
    country:
      String(account.country || '').trim() ||
      String(account.location || '').split(',').pop().trim() ||
      'Pending profile completion',
    services: Array.isArray(account.services)
      ? account.services.filter((service) => typeof service === 'string')
      : [],
    termsAccepted: account.termsAccepted === true,
    termsVersion: String(account.termsVersion || ''),
    termsAcceptedAt: account.termsAcceptedAt ? new Date(account.termsAcceptedAt) : null,
    notificationsConsent: account.notificationsConsent === true,
    notificationsConsentAt: account.notificationsConsentAt
      ? new Date(account.notificationsConsentAt)
      : null,
    marketingConsent: account.marketingConsent === true,
    marketingConsentAt: account.marketingConsentAt
      ? new Date(account.marketingConsentAt)
      : null,
    password: crypto.randomBytes(48).toString('hex'),
    authProvider:
      authProvider === 'google' ? 'google' : 'bliss-app-migrated-password',
    userType: 'customer',
    emailVerified: account.emailVerified === true || authProvider === 'google',
    phoneVerified: account.phoneVerified === true,
    isActive: account.isActive !== false,
    profileStatus: String(account.profileStatus || 'active'),
    memberSince: account.createdAt ? new Date(account.createdAt) : new Date(),
    lastLoginAt: account.lastLoginAt ? new Date(account.lastLoginAt) : null,
    createdAt: account.createdAt ? new Date(account.createdAt) : new Date(),
  };
}

async function getUniqueBlissId(UserModel) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const blissId = buildBlissId(new Date().getFullYear(), crypto.randomInt(1, 1000000));
    if (!(await UserModel.exists({ blissId }))) return blissId;
  }
  throw new Error('Could not generate a unique Bliss ID for an imported account.');
}

function normalizedAccountPhoneMatches(user, sourcePhone) {
  const normalizedSource = normalizePhone(sourcePhone);
  if (!normalizedSource) return true;
  return normalizePhone(user.phone) === normalizedSource;
}

async function migrateAccounts(sourceDb, UserModel, aliases, summary, apply) {
  const accounts = await sourceDb.collection('customer_accounts').find({}).toArray();
  summary.users.scanned = accounts.length;

  for (const account of accounts) {
    const sourceId = String(account.id ?? account._id ?? '');
    const imported = sourceId
      ? await UserModel.findOne({ legacyBlissAppId: sourceId }).select('+legacyPasswordHash').lean()
      : null;
    if (imported) {
      summary.users.matched += 1;
      addAliases(aliases, [sourceId, account.email, account.phone], imported.blissId);
      continue;
    }

    const profile = accountProfile(account, sourceId);
    if (!profile) {
      summary.users.skipped += 1;
      continue;
    }

    const emailUser = await UserModel.findOne({ email: profile.email }).select('+legacyPasswordHash').lean();
    const phoneUser = await UserModel.findOne({ phone: profile.phone }).select('+legacyPasswordHash').lean();
    const existingUsers = new Map(
      [emailUser, phoneUser].filter(Boolean).map((user) => [String(user._id), user]),
    );

    if (existingUsers.size) {
      const [existing] = existingUsers.values();
      const exactMatch =
        existingUsers.size === 1 &&
        String(existing.email || '').toLowerCase() === profile.email &&
        normalizedAccountPhoneMatches(existing, account.phone);
      if (!exactMatch) {
        summary.users.conflicts += 1;
        continue;
      }

      summary.users.matched += 1;
      addAliases(aliases, [sourceId, account.email, account.phone], existing.blissId);
      continue;
    }

    profile.blissId = await getUniqueBlissId(UserModel);
    if (apply) {
      const user = new UserModel(profile);
      await user.save();
      summary.users.created += 1;
      addAliases(aliases, [sourceId, account.email, account.phone], user.blissId);
    } else {
      summary.users.created += 1;
      addAliases(aliases, [sourceId, account.email, account.phone], profile.blissId);
    }
  }
}

function candidateProfile(profile, sourceProfileId) {
  const email = String(profile.email || '').trim().toLowerCase();
  const phone = normalizePhone(profile.phone || profile.whatsapp);
  const fullName = String(profile.full_name || profile.fullName || '').trim();
  if (!sourceProfileId || !isEmail(email) || !phone || fullName.length < 2) return null;

  const age = Number(profile.age);
  return {
    legacyBlissAppProfileId: sourceProfileId,
    fullName,
    name: fullName,
    email,
    phone,
    uniqueCode: profile.bliss_id ? String(profile.bliss_id) : undefined,
    candidateId: profile.candidate_id ? String(profile.candidate_id) : null,
    country: String(profile.country || ''),
    age: Number.isFinite(age) ? age : undefined,
    experience: String(profile.experience ?? ''),
    jobPosition: String(profile.job || profile.jobPosition || ''),
    legacyProfileStatus: String(profile.status || ''),
    status: 'available',
    currentStatus: 'Registration',
    applicationStatus: 'Pending Payment',
    paymentStatus: 'Pending',
    applicationDate: profile.created_at ? new Date(profile.created_at) : new Date(),
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
  };
}

async function migrateProfiles(sourceDb, CandidateModel, aliases, summary, apply) {
  const profiles = await sourceDb.collection('profiles').find({}).toArray();
  summary.candidates.scanned = profiles.length;

  for (const profile of profiles) {
    const sourceProfileId = String(profile._id ?? '');
    const imported = sourceProfileId
      ? await CandidateModel.findOne({ legacyBlissAppProfileId: sourceProfileId }).lean()
      : null;
    if (imported) {
      summary.candidates.matched += 1;
      continue;
    }

    const candidate = candidateProfile(profile, sourceProfileId);
    if (!candidate) {
      summary.candidates.skipped += 1;
      continue;
    }

    const criteria = [
      { email: candidate.email },
      { phone: candidate.phone },
      ...(candidate.uniqueCode ? [{ uniqueCode: candidate.uniqueCode }] : []),
      ...(candidate.candidateId ? [{ candidateId: candidate.candidateId }] : []),
    ];
    const matches = await CandidateModel.find({ $or: criteria }).lean();
    if (matches.length) {
      const exact = matches.length === 1 &&
        String(matches[0].email || '').trim().toLowerCase() === candidate.email &&
        normalizePhone(matches[0].phone) === candidate.phone;
      if (!exact) {
        summary.candidates.conflicts += 1;
      } else {
        summary.candidates.matched += 1;
      }
      continue;
    }

    if (apply) {
      await new CandidateModel(candidate).save();
    }
    summary.candidates.created += 1;

    const mappedUserId =
      aliases.get(normalizeIdentifier(profile.email)) ||
      aliases.get(normalizeIdentifier(profile.phone)) ||
      aliases.get(normalizeIdentifier(profile.whatsapp));
    if (mappedUserId) {
      addAliases(
        aliases,
        [sourceProfileId, profile.bliss_id, profile.candidate_id],
        mappedUserId,
      );
    }
  }
}

async function resolveUserId(value, aliases, UserModel) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const mapped = aliases.get(normalizeIdentifier(raw));
  if (mapped) return mapped;

  const phone = normalizePhone(raw);
  const filters = [{ blissId: raw }, { email: raw.toLowerCase() }];
  if (phone) filters.push({ phone });
  const user = await UserModel.findOne({ $or: filters }).select('blissId').lean();
  if (!user?.blissId) return '';
  addAliases(aliases, [raw, user.blissId], user.blissId);
  return user.blissId;
}

async function migrateConversations(sourceDb, targetDb, UserModel, aliases, summary, apply) {
  const conversations = await sourceDb.collection('conversations').find({}).toArray();
  summary.conversations.scanned = conversations.length;
  const conversationIds = new Map();
  const sourceToTargetUser = new Map();
  const collection = targetDb.collection('inbox_conversations');

  for (const conversation of conversations) {
    const sourceConversationId = String(conversation.id ?? conversation._id ?? '');
    const sourceUserId = conversation.user_id ?? conversation.userId;
    const userId = await resolveUserId(sourceUserId, aliases, UserModel);
    if (!sourceConversationId || !userId) {
      summary.conversations.skipped += 1;
      continue;
    }

    const targetConversation = mapConversation(conversation, userId);
    conversationIds.set(normalizeIdentifier(sourceConversationId), targetConversation.conversationId);
    if (conversation.conversation_uuid) {
      conversationIds.set(
        normalizeIdentifier(conversation.conversation_uuid),
        targetConversation.conversationId,
      );
    }
    sourceToTargetUser.set(normalizeIdentifier(sourceUserId), userId);

    const existing = await collection.findOne({ _id: targetConversation._id });
    if (existing) {
      summary.conversations.matched += 1;
    } else {
      if (apply) {
        const result = await collection.updateOne(
          { _id: targetConversation._id },
          { $setOnInsert: targetConversation },
          { upsert: true },
        );
        if (result.upsertedCount) summary.conversations.created += 1;
        else summary.conversations.matched += 1;
      } else {
        summary.conversations.created += 1;
      }
    }
  }

  return { conversationIds, sourceToTargetUser };
}

async function migrateMessages(
  sourceDb,
  targetDb,
  UserModel,
  aliases,
  conversationIds,
  summary,
  apply,
) {
  const messages = await sourceDb.collection('messages').find({}).toArray();
  summary.messages.scanned = messages.length;
  const collection = targetDb.collection('inbox_messages');

  for (const message of messages) {
    const legacyConversationId = normalizeIdentifier(
      message.conversation_id ?? message.conversationId,
    );
    const targetConversationId = conversationIds.get(legacyConversationId);
    if (!targetConversationId) {
      summary.messages.skipped += 1;
      continue;
    }

    const targetMessage = mapMessage(message, targetConversationId, (value) =>
      aliases.get(normalizeIdentifier(value)),
    );
    const existing = await collection.findOne({ _id: targetMessage._id });
    if (existing) {
      summary.messages.matched += 1;
      continue;
    }
    if (apply) {
      const result = await collection.updateOne(
        { _id: targetMessage._id },
        { $setOnInsert: targetMessage },
        { upsert: true },
      );
      if (result.upsertedCount) summary.messages.created += 1;
      else summary.messages.matched += 1;
    } else {
      summary.messages.created += 1;
    }
  }
}

async function migrateDeviceTokens(sourceDb, targetDb, aliases, summary, apply) {
  const tokens = await sourceDb.collection('device_tokens').find({}).toArray();
  summary.deviceTokens.scanned = tokens.length;
  const collection = targetDb.collection(PushToken.collection.name);

  for (const record of tokens) {
    const userId =
      aliases.get(normalizeIdentifier(record.userId)) ||
      aliases.get(normalizeIdentifier(record.profileId));
    if (!record.token || !userId) {
      summary.deviceTokens.skipped += 1;
      continue;
    }

    const filter = { userId, token: record.token };
    const existing = await collection.findOne(filter);
    if (existing) {
      summary.deviceTokens.matched += 1;
      continue;
    }
    if (apply) {
      const result = await collection.updateOne(
        filter,
        {
          $setOnInsert: {
            ...filter,
            userType: 'candidate',
            platform: record.platform || 'unknown',
            createdAt: record.created_at ? new Date(record.created_at) : new Date(),
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount) summary.deviceTokens.created += 1;
      else summary.deviceTokens.matched += 1;
    } else {
      summary.deviceTokens.created += 1;
    }
  }
}

async function runMigration({ sourceDb, targetDb, UserModel, CandidateModel, apply }) {
  const summary = createSummary();
  const aliases = new Map();

  await migrateAccounts(sourceDb, UserModel, aliases, summary, apply);
  await migrateProfiles(sourceDb, CandidateModel, aliases, summary, apply);
  const { conversationIds } = await migrateConversations(
    sourceDb,
    targetDb,
    UserModel,
    aliases,
    summary,
    apply,
  );
  await migrateMessages(
    sourceDb,
    targetDb,
    UserModel,
    aliases,
    conversationIds,
    summary,
    apply,
  );
  await migrateDeviceTokens(sourceDb, targetDb, aliases, summary, apply);
  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return;
  }
  if (args.some((arg) => arg !== '--apply')) {
    throw new Error(USAGE);
  }

  const apply = args.includes('--apply');
  const sourceUri = process.env.BLISS_APP_MONGO_URI;
  const targetUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!sourceUri || !targetUri) {
    throw new Error('Both BLISS_APP_MONGO_URI and MONGO_URI/MONGODB_URI are required.');
  }

  const sourceConnection = mongoose.createConnection(sourceUri);
  const targetConnection = mongoose.createConnection(targetUri);
  try {
    await Promise.all([sourceConnection.asPromise(), targetConnection.asPromise()]);
    if (
      sourceConnection.host === targetConnection.host &&
      sourceConnection.db.databaseName === targetConnection.db.databaseName
    ) {
      throw new Error('Source and destination point to the same MongoDB database.');
    }

    const UserModel = targetConnection.model(
      'BlissCommunicationUser',
      BlissCommunicationUser.schema,
    );
    const CandidateModel = targetConnection.model('Candidate', Candidate.schema);
    await Promise.all([UserModel.init(), CandidateModel.init()]);

    const summary = await runMigration({
      sourceDb: sourceConnection.db,
      targetDb: targetConnection.db,
      UserModel,
      CandidateModel,
      apply,
    });
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', summary }, null, 2));
  } finally {
    await Promise.all([sourceConnection.close(), targetConnection.close()]);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Bliss App migration failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { runMigration };
