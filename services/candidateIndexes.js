const Candidate = require('../models/candidate');

async function initializeCandidateIndexes() {
  let indexes = [];
  try {
    indexes = await Candidate.collection.indexes();
  } catch (error) {
    if (error.code !== 26 && error.codeName !== 'NamespaceNotFound') {
      throw error;
    }
  }

  const uniqueCodeIndex = indexes.find((index) => index.key?.uniqueCode === 1);
  const hasPartialUniqueCodeIndex =
    uniqueCodeIndex?.unique === true &&
    uniqueCodeIndex.partialFilterExpression?.uniqueCode?.$type === 'string';

  if (uniqueCodeIndex && !hasPartialUniqueCodeIndex) {
    await Candidate.collection.dropIndex(uniqueCodeIndex.name);
  }

  for (const [keys, options] of Candidate.schema.indexes()) {
    const indexOptions = { ...options };
    delete indexOptions._autoIndex;
    await Candidate.collection.createIndex(keys, indexOptions);
  }
}

module.exports = { initializeCandidateIndexes };
