const SERVICE_QUEUES = {
  candidate: { queueType: 'Candidate Chats', department: 'Recruitment' },
  employer: { queueType: 'Employer Chats', department: 'Employer Relations' },
  visa: { queueType: 'Visa Applications', department: 'Visa' },
  ticket: { queueType: 'Ticket Booking Chats', department: 'Travel' },
  holidayBooking: { queueType: 'Holiday Booking Chats', department: 'Travel' },
  holiday: { queueType: 'Holiday Chat', department: 'Travel' },
  unclassified: { queueType: 'Unclassified', department: 'Customer Care' },
};

function titleCase(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function inferJobTitle(text) {
  const matchers = [
    [/\b(house\s*maid|housemaid|domestic\s+worker)\b/i, 'Housemaid'],
    [/\b(caregiver|care\s*giver|nurse)\b/i, 'Caregiver'],
    [/\b(driver|chauffeur)\b/i, 'Driver'],
    [/\b(security\s+guard|security)\b/i, 'Security Guard'],
    [/\b(farm\s+worker|farmworker|agricultural\s+worker)\b/i, 'Farm Worker'],
    [/\b(waiter|waitress|server)\b/i, 'Waiter'],
    [/\b(cleaner|cleaning\s+staff)\b/i, 'Cleaner'],
  ];
  return matchers.find(([pattern]) => pattern.test(text))?.[1] || '';
}

function inferDestination(text) {
  const destinations = [
    'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'South Korea',
    'Abu Dhabi', 'Hong Kong', 'New Zealand', 'Dubai', 'Qatar', 'Kuwait',
    'Oman', 'Bahrain', 'Canada', 'Australia', 'Germany', 'Poland', 'Cyprus',
    'Singapore', 'Malaysia', 'Turkey', 'Riyadh', 'Jeddah', 'Doha', 'London',
    'UAE', 'UK', 'USA', 'US',
  ];
  for (const destination of destinations) {
    const pattern = new RegExp(`\\b(?:in|to)\\s+${destination}\\b`, 'i');
    if (pattern.test(text)) return destination;
  }
  return '';
}

function classifyStaffChat(payload = {}) {
  const text = [
    payload.message_text, payload.message, payload.text, payload.body,
    payload.subject, payload.jobTitle, payload.job_title,
  ].filter(Boolean).join(' ');
  const normalized = text.toLowerCase();
  const userType = String(payload.userType || payload.user_type || '').toLowerCase();
  const explicitQueue = payload.queueName || payload.queue || payload.serviceQueue || payload.serviceCategory;
  const explicitQueueType = payload.queueType || payload.queue_type;
  const declaredJobTitle = payload.jobTitle || payload.job_title || '';
  const jobTitle = inferJobTitle(String(declaredJobTitle)) || declaredJobTitle || inferJobTitle(text);
  const destination = payload.destination || payload.jobLocation || payload.job_location || inferDestination(text);

  let route;
  if (/\bvisa\b|\bimmigration\b/.test(normalized)) route = SERVICE_QUEUES.visa;
  else if (/\b(ticket|flight|airline|boarding pass)\b/.test(normalized)) route = SERVICE_QUEUES.ticket;
  else if (/\b(holiday booking|book a holiday|holiday package|vacation package|tour package)\b/.test(normalized)) route = SERVICE_QUEUES.holidayBooking;
  else if (/\b(holiday|vacation|tourism|travel)\b/.test(normalized)) route = SERVICE_QUEUES.holiday;
  else if (userType.includes('employer')) route = SERVICE_QUEUES.employer;
  else if (/\b(employer|company|staffing|job order)\b/.test(normalized) ||
      /\b(we are hiring|we're hiring|looking to hire|need to hire|seeking employees)\b/.test(normalized)) route = SERVICE_QUEUES.employer;
  else if (userType.includes('candidate') || userType.includes('applicant') || userType.includes('jobseeker') || jobTitle || /\b(job|work|employment|apply|application)\b/.test(normalized)) route = SERVICE_QUEUES.candidate;
  else route = SERVICE_QUEUES.unclassified;

  // Honor explicit backend integrations when they already supply a known service queue.
  const knownQueues = Object.values(SERVICE_QUEUES);
  const explicit = knownQueues.find((item) =>
    item.queueType.toLowerCase() === String(explicitQueue || '').trim().toLowerCase() ||
    item.queueType.toLowerCase() === String(explicitQueueType || '').trim().toLowerCase()
  );
  if (explicit) route = explicit;
  const customQueueName = explicitQueue && !explicit ? String(explicitQueue).trim() : '';

  const dynamicQueue = route.queueType === 'Candidate Chats' && jobTitle
    ? [destination, titleCase(String(jobTitle))].filter(Boolean).join(' ')
    : '';

  return {
    queueType: route.queueType,
    queueName: dynamicQueue || customQueueName || route.queueType,
    department: route.department,
    jobTitle: jobTitle ? titleCase(String(jobTitle)) : '',
    destination: destination ? titleCase(String(destination)) : '',
  };
}

module.exports = { classifyStaffChat };
