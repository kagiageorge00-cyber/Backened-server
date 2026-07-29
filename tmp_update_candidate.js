const mongoose = require('mongoose');
require('dotenv').config();
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false, collection: 'candidates' }));
    const res = await Candidate.updateOne(
      { uniqueCode: 'CAND-2026-3741' },
      { $set: { isVerified: true, status: 'available', availability: 'Available', currentStatus: 'Approved', profileCompletion: 100, contactReleased: true } }
    );
    console.log(JSON.stringify(res, null, 2));
    const updated = await Candidate.findOne({ uniqueCode: 'CAND-2026-3741' }).lean();
    console.log(JSON.stringify({
      uniqueCode: updated?.uniqueCode,
      name: updated?.fullName || updated?.name,
      status: updated?.status,
      isVerified: updated?.isVerified,
      availability: updated?.availability,
      currentStatus: updated?.currentStatus,
      contactReleased: updated?.contactReleased,
    }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
