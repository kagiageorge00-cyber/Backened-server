const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const collections = (await db.listCollections().toArray()).map((c) => c.name);
    console.log('COLLECTIONS', collections);

    const target = await Candidate.findOne({ uniqueCode: 'CAND-2026-7885' }).lean();
    console.log('TARGET', JSON.stringify(target, null, 2));

    for (const name of collections) {
      if (['candidates', 'candidate', 'system.indexes'].includes(name)) continue;
      const coll = db.collection(name);
      const docs = await coll.find({
        $or: [
          { phone: target?.phone },
          { email: target?.email },
          { candidateId: target?.uniqueCode },
          { candidateCode: target?.uniqueCode },
          { candidatePhone: target?.phone },
          { candidateEmail: target?.email },
        ],
      }).limit(20).toArray();
      if (docs.length) {
        console.log('COLLECTION', name, docs.length);
        console.log(JSON.stringify(docs.slice(0, 5), null, 2));
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
