require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const Candidate = require('../models/candidate');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const fields = ['fullName','nationality','religion','education','experience','skills','languages','dateOfBirth','jobPosition','expectedSalary','destinationCountry'];
    const candidates = await Candidate.find().lean();
    console.log('TOTAL CANDIDATES:', candidates.length);
    let visibleCount = 0;
    candidates.forEach((c, idx) => {
      const missing = fields.filter(f => {
        const v = c[f];
        if (Array.isArray(v)) return v.length === 0;
        return v === undefined || v === null || v === '';
      });
      const candidateCode = c.candidateId || c.uniqueCode || 'none';
      const candidateName = c.fullName || c.name || 'none';
      const isValidCandCode = /^CAND-\d{4}-\d{4,}$/.test(candidateCode);
      if (!isValidCandCode) return;

      visibleCount++;
      console.log(`\nCANDIDATE ${visibleCount} CODE: ${candidateCode} NAME: ${candidateName}`);
      console.log('  missing:', missing.length > 0 ? missing.join(', ') : 'none');
    });
    console.log('VALID CANDIDATES WITH CAND- CODES:', visibleCount);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
