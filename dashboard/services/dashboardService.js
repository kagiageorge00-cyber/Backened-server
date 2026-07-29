const DashboardRepository = require('../repositories/dashboardRepository');

class DashboardService {
  constructor(repository = new DashboardRepository()) {
    this.repository = repository;
  }

  async buildDashboard(user) {
    const userId = user?.sub;
    const userRecord = await this.repository.getUserById(userId);

    if (!userRecord) {
      throw new Error('User not found.');
    }

    const [applications, jobApplications, messages, notifications, interviews, visaUpdates, announcements, appointments] = await Promise.all([
      this.repository.getApplications(userId),
      this.repository.getJobApplications(userId),
      this.repository.getMessages(userId),
      this.repository.getNotifications(userId),
      this.repository.getInterviews(userId),
      this.repository.getVisaUpdates(userId),
      this.repository.getAnnouncements(),
      this.repository.getAppointments(userId),
    ]);

    const progressStages = [
      'Registration',
      'Documents Verified',
      'Application Submitted',
      'Employer Review',
      'Interview',
      'Medical',
      'Visa',
      'Flight',
      'Deployment',
    ];

    const completedCount = Math.min(4, applications.length + (userRecord.emailVerified ? 1 : 0) + (userRecord.phoneVerified ? 1 : 0));
    const percent = Math.min(100, Math.round((completedCount / progressStages.length) * 100));
    const currentStage = progressStages[Math.min(progressStages.length - 1, Math.floor(completedCount / 2))];
    const nextStage = progressStages[Math.min(progressStages.length - 1, Math.floor(completedCount / 2) + 1)] || progressStages[progressStages.length - 1];

    return {
      profile: {
        blissId: userRecord.blissId,
        candidateId: userRecord.candidateId || null,
        fullName: userRecord.fullName,
        profilePhotoUrl: userRecord.profilePhotoUrl || 'https://i.pravatar.cc/120',
        email: userRecord.email,
        phone: userRecord.phone,
        country: userRecord.country,
        accountStatus: userRecord.status || 'active',
        emailVerified: Boolean(userRecord.emailVerified),
        phoneVerified: Boolean(userRecord.phoneVerified),
        memberSince: userRecord.createdAt,
        lastLogin: userRecord.lastLoginAt || userRecord.updatedAt,
      },
      recruitmentProgress: {
        stages: progressStages,
        currentStage,
        progressPercentage: percent,
        nextStage,
        nextRequiredAction: completedCount < 2 ? 'Verify your email and phone number.' : 'Submit the next required document.',
        estimatedCompletion: `${100 - percent}% remaining`,
      },
      statistics: {
        applicationsSubmitted: applications.length,
        applicationsUnderReview: jobApplications.filter((item) => item.status === 'under_review').length,
        applicationsApproved: jobApplications.filter((item) => item.status === 'approved').length,
        applicationsRejected: jobApplications.filter((item) => item.status === 'rejected').length,
        countriesApplied: new Set(jobApplications.map((item) => item.country).filter(Boolean)).size,
        interviewsScheduled: interviews.filter((item) => item.status === 'scheduled').length,
        interviewsCompleted: interviews.filter((item) => item.status === 'completed').length,
        visaApplications: visaUpdates.length,
        flightsBooked: 0,
        unreadMessages: messages.filter((entry) => entry.unread).length,
        unreadNotifications: notifications.filter((entry) => !entry.read).length,
      },
      messages: messages.map((message) => ({
        conversationId: message.conversationId || message._id,
        departmentName: message.departmentName || 'Customer Support',
        departmentIcon: message.departmentIcon || 'support_agent',
        lastMessage: message.body || message.lastMessage || 'No message yet.',
        messagePreview: message.preview || message.body || 'No message yet.',
        timestamp: message.createdAt,
        unreadCount: message.unreadCount || (message.unread ? 1 : 0),
        priority: message.priority || 'normal',
      })),
      notifications: notifications.map((notification) => ({
        id: notification._id,
        title: notification.title || 'Notification',
        description: notification.description || notification.message || '',
        category: notification.category || 'general',
        priority: notification.priority || 'normal',
        createdDate: notification.createdAt,
        readStatus: notification.read ? 'read' : 'unread',
        actionButton: notification.actionButton || 'View',
      })),
      jobAlerts: jobApplications.slice(0, 3).map((item) => ({
        jobId: item.jobId || item._id,
        jobTitle: item.jobTitle || 'Matching Opportunity',
        employer: item.employer || 'Bliss',
        country: item.country || 'Unknown',
        city: item.city || 'Remote',
        salary: item.salary || 'Negotiable',
        employmentType: item.employmentType || 'Full-time',
        experienceRequired: item.experienceRequired || 'Not specified',
        educationRequired: item.educationRequired || 'Not specified',
        closingDate: item.closingDate || null,
        applicationStatus: item.status || 'pending',
      })),
      interviews: interviews.slice(0, 3).map((item) => ({
        interviewId: item._id,
        employer: item.employer || 'Recruitment Team',
        jobTitle: item.jobTitle || 'Interview',
        interviewDate: item.interviewDate,
        interviewTime: item.interviewTime || 'TBD',
        interviewType: item.interviewType || 'Virtual',
        interviewLocation: item.interviewLocation || 'Online',
        status: item.status || 'scheduled',
        confirmationRequired: Boolean(item.confirmationRequired),
      })),
      visaUpdates: visaUpdates.slice(0, 3).map((item) => ({
        visaApplicationId: item._id,
        country: item.country || 'Unknown',
        visaStatus: item.status || 'pending',
        stage: item.stage || 'Processing',
        appointmentDate: item.appointmentDate || null,
        embassy: item.embassy || 'To be confirmed',
        remarks: item.remarks || 'Awaiting update',
      })),
      flightUpdates: [],
      announcements: announcements.map((item) => ({
        announcementId: item._id,
        title: item.title || 'Announcement',
        description: item.description || '',
        priority: item.priority || 'normal',
        category: item.category || 'general',
        createdDate: item.createdAt,
        expiryDate: item.expiryDate || null,
      })),
      todayActivities: appointments.slice(0, 4).map((item) => ({
        time: item.time || 'TBD',
        title: item.title || 'Appointment',
        description: item.description || '',
        location: item.location || 'To be confirmed',
        status: item.status || 'scheduled',
      })),
      upcomingEvents: appointments.slice(0, 4).map((item) => ({
        date: item.appointmentDate,
        time: item.time || 'TBD',
        category: item.category || 'appointment',
        status: item.status || 'scheduled',
      })),
      nextAction: {
        title: completedCount < 2 ? 'Verify Your Account' : 'Complete Profile',
        description: completedCount < 2 ? 'Verify your email and phone to unlock the dashboard.' : 'Upload the next required document and continue.',
        actionButton: completedCount < 2 ? 'Verify Now' : 'Continue',
        priority: completedCount < 2 ? 'high' : 'medium',
      },
      support: {
        supportEmail: 'blssspprtteam@gmail.com',
        supportPhone: '+254700000000',
        supportChatAvailability: '24/7',
        workingHours: 'Mon-Sun 08:00-22:00',
        emergencyContact: '+254700000001',
      },
    };
  }
}

module.exports = DashboardService;
