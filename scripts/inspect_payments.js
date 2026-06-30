require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const db = mongoose.connection.db;
    
    // Check payments collection
    const payments = db.collection('payments');
    const paymentCount = await payments.countDocuments();
    console.log('Payments count:', paymentCount);
    
    if (paymentCount > 0) {
      const sample = await payments.findOne();
      console.log('\nPayment document keys:');
      console.log(Object.keys(sample).sort().join(', '));
      
      console.log('\nLooking for profile fields in payments:');
      const profileFields = ['nationality', 'jobPosition', 'religion', 'destinationCountry', 'expectedSalary', 'education', 'candidateData', 'profileData', 'formData'];
      profileFields.forEach(field => {
        if (field in sample) {
          console.log('FOUND ' + field + ': ' + JSON.stringify(sample[field]).substring(0, 100));
        }
      });
      
      // Show first 3 payment records to understand structure
      console.log('\n\nFirst Payment Record (partial):');
      console.log('ID:', sample._id);
      console.log('Keys:', Object.keys(sample).slice(0, 15).join(', '), '...');
    }
    
    await mongoose.connection.close();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
