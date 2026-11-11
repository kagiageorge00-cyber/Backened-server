const nonEmptyString = { $type: 'string', $regex: /\S/ };

function candidateMarketplaceEligibilityFilter() {
  return {
    paymentStatus: /^paid$/i,
    uniqueCode: nonEmptyString,
    password: nonEmptyString,
    $and: [
      {
        $or: [
          { passportUrl: nonEmptyString },
          { medicalUrl: nonEmptyString },
          { resumeUrl: nonEmptyString },
          { additionalUrl: nonEmptyString },
          { goodConductUrl: nonEmptyString },
          { otherDocumentUrl: nonEmptyString },
          { nationalIdFrontUrl: nonEmptyString },
          { nationalIdBackUrl: nonEmptyString },
          { 'documents.passportPhoto': nonEmptyString },
          { 'documents.nationalId': nonEmptyString },
          { 'documents.cv': nonEmptyString },
          { 'documents.coverLetter': nonEmptyString },
          { 'documents.certificates.0': { $exists: true } },
          { 'documents.uploads.0': { $exists: true } },
        ],
      },
    ],
  };
}

module.exports = { candidateMarketplaceEligibilityFilter };
