require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Candidate = require('./models/candidate');

const candidateCode = 'CAND-2026-3741';
const files = {
  passport: 'C:/Users/PC/Downloads/img20260210_14383224.pdf',
  medical: 'C:/Users/PC/Downloads/KOMBO ESTHER LORNAH MEDICALLY FIT REPORT (1).pdf',
  video: 'C:/Users/PC/Downloads/WhatsApp Video 2026-08-21 at 7.45.30 AM.mp4',
};

function calculateProfileCompletion(candidate) {
  const fields = [
    'photoUrl', 'nationality', 'religion', 'education', 'experience',
    'skills', 'languages', 'dateOfBirth', 'jobPosition', 'expectedSalary',
    'destinationCountry',
  ];
  const completed = fields.filter((field) => {
    const value = candidate[field];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  return Math.round((completed / fields.length) * 100);
}

async function upload(file, type) {
  const result = await cloudinary.uploader.upload(file, {
    folder: `bliss-connect/candidates/${candidateCode}`,
    resource_type: 'auto',
    public_id: type,
    overwrite: true,
  });
  if (!result.secure_url) throw new Error(`Cloudinary returned no URL for ${type}`);
  return result.secure_url;
}

(async () => {
  try {
    if (process.env.CLOUDINARY_URL) cloudinary.config(process.env.CLOUDINARY_URL);
    else cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const candidate = await Candidate.findOne({ uniqueCode: candidateCode });
    if (!candidate) throw new Error(`Candidate not found: ${candidateCode}`);

    const [passportUrl, medicalUrl, videoUrl] = await Promise.all([
      upload(files.passport, 'passport'),
      upload(files.medical, 'medical'),
      upload(files.video, 'introduction-video'),
    ]);

    candidate.email = 'estherlorna@gmail.com';
    candidate.phone = '+254704756910';
    candidate.jobPosition = 'Housemaid';
    candidate.jobType = 'Housemaid';
    candidate.destinationCountry = 'Dubai';
    candidate.dateOfBirth = '04/04/1994';
    candidate.numberOfChildren = 2;
    candidate.maritalStatus = 'Married';
    candidate.passportUrl = passportUrl;
    candidate.medicalUrl = medicalUrl;
    candidate.videoUrl = videoUrl;
    candidate.introductionVideoUrl = videoUrl;
    candidate.isVerified = true;
    candidate.status = 'available';
    candidate.contactReleased = true;
    candidate.currentStatus = 'Approved';
    candidate.documents = {
      ...(candidate.documents?.toObject?.() || candidate.documents || {}),
      passportPhoto: passportUrl,
    };
    candidate.profileCompletion = calculateProfileCompletion(candidate);
    await candidate.save();

    console.log(JSON.stringify({
      candidateId: candidate.uniqueCode,
      email: candidate.email,
      phone: candidate.phone,
      status: candidate.status,
      isVerified: candidate.isVerified,
      profileCompletion: candidate.profileCompletion,
      photoUrl: candidate.photoUrl,
      passportUrl,
      medicalUrl,
      videoUrl,
    }, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
