const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const deleted = await Candidate.deleteMany({
      $or: [
        { fullName: /render verify/i },
        { name: /render verify/i },
        { email: /render verify/i },
        { uniqueCode: /render verify/i },
      ],
    });
    console.log(JSON.stringify({ deletedCount: deleted.deletedCount }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
