#!/usr/bin/env node
/*
Migration: Replace placeholder example.com photo URLs with Cloudinary URLs or null.

Usage:
  MONGO_URI="mongodb://..." node scripts/migrate_photo_urls.js

What it does:
 - Finds Candidate documents where `photoUrl` or `profilePhoto` contains `example.com/photo`.
 - Attempts to find a Cloudinary URL in `candidate.documents.uploads[].url`.
 - If found, sets `photoUrl` and `profilePhoto` to the Cloudinary URL.
 - Otherwise sets `photoUrl` and `profilePhoto` to `null`.
 - Prints a summary of updates.
*/

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const Candidate = require(path.join(__dirname, '..', 'models', 'candidate'));

async function connect() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set. Export MONGO_URI and re-run.');
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to MongoDB');
}

function looksLikeCloudinary(url) {
  if (!url || typeof url !== 'string') return false;
  return /res\.cloudinary\.com|cloudinary\.com/.test(url);
}

async function run() {
  try {
    await connect();

    const query = {
      $or: [
        { photoUrl: /example\.com\/photo/i },
        { profilePhoto: /example\.com\/photo/i },
      ],
    };

    const candidates = await Candidate.find(query).lean();
    console.log(`Found ${candidates.length} candidate(s) with placeholder photo URLs`);

    let updated = 0;
    for (const c of candidates) {
      let replacement = null;

      // look in documents.uploads for cloudinary or other valid url
      if (c.documents && Array.isArray(c.documents.uploads)) {
        const found = c.documents.uploads.find((u) => {
          if (!u) return false;
          if (u.url && looksLikeCloudinary(u.url)) return true;
          // fallback: any non-example.com url
          if (u.url && !/example\.com\/photo/i.test(u.url)) return true;
          return false;
        });
        if (found && found.url) replacement = found.url;
      }

      // also check top-level fields that may already have a cloudinary url
      if (!replacement) {
        if (c.photoUrl && looksLikeCloudinary(c.photoUrl)) replacement = c.photoUrl;
        if (!replacement && c.profilePhoto && looksLikeCloudinary(c.profilePhoto)) replacement = c.profilePhoto;
      }

      const update = {};
      if (replacement) {
        update.photoUrl = replacement;
        update.profilePhoto = replacement;
      } else {
        update.photoUrl = null;
        update.profilePhoto = null;
      }

      const res = await Candidate.updateOne({ _id: c._id }, { $set: update });
      if (res.modifiedCount && res.modifiedCount > 0) {
        updated++;
        console.log(`Updated candidate ${c._id} -> ${replacement || 'null'}`);
      }
    }

    console.log(`✅ Migration complete. Updated ${updated} candidate(s).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();
