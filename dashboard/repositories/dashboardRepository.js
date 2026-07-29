const UserModel = require('../../models/BlissCommunicationUser');
const ApplicationModel = require('../../models/Application');
const JobApplicationModel = require('../../models/JobApplication');
const MessageModel = require('../../models/Message');
const NotificationModel = require('../../models/Notification');
const InterviewModel = require('../../models/Interview');
const VisaModel = require('../../models/Visa');
const AnnouncementModel = require('../../models/Announcement');
const AppointmentModel = require('../../models/Appointment');

class DashboardRepository {
  constructor(dependencies = {}) {
    this.userModel = dependencies.userModel || UserModel;
    this.applicationModel = dependencies.applicationModel || ApplicationModel;
    this.jobApplicationModel = dependencies.jobApplicationModel || JobApplicationModel;
    this.messageModel = dependencies.messageModel || MessageModel;
    this.notificationModel = dependencies.notificationModel || NotificationModel;
    this.interviewModel = dependencies.interviewModel || InterviewModel;
    this.visaModel = dependencies.visaModel || VisaModel;
    this.announcementModel = dependencies.announcementModel || AnnouncementModel;
    this.appointmentModel = dependencies.appointmentModel || AppointmentModel;
  }

  async getUserById(userId) {
    const result = await this.userModel.findById(userId);
    if (result && typeof result.lean === 'function') {
      return result.lean();
    }
    return result;
  }

  async getApplications(userId) {
    const result = await this.applicationModel.find({ userId });
    if (Array.isArray(result)) return result;
    if (result && typeof result.lean === 'function') return result.lean();
    return result || [];
  }

  async getJobApplications(userId) {
    const result = await this.jobApplicationModel.find({ userId });
    if (Array.isArray(result)) return result;
    if (result && typeof result.lean === 'function') return result.lean();
    return result || [];
  }

  async getMessages(userId) {
    const query = this.messageModel.find({ userId });
    if (query && typeof query.sort === 'function') {
      const limited = query.sort({ createdAt: -1 }).limit(5);
      if (limited && typeof limited.lean === 'function') {
        return limited.lean();
      }
      return limited;
    }
    return [];
  }

  async getNotifications(userId) {
    const query = this.notificationModel.find({ userId });
    if (query && typeof query.sort === 'function') {
      const limited = query.sort({ createdAt: -1 }).limit(8);
      if (limited && typeof limited.lean === 'function') {
        return limited.lean();
      }
      return limited;
    }
    return [];
  }

  async getInterviews(userId) {
    const query = this.interviewModel.find({ userId });
    if (query && typeof query.sort === 'function') {
      const result = query.sort({ interviewDate: 1 });
      if (result && typeof result.lean === 'function') return result.lean();
      return result || [];
    }
    return [];
  }

  async getVisaUpdates(userId) {
    const query = this.visaModel.find({ userId });
    if (query && typeof query.sort === 'function') {
      const result = query.sort({ createdAt: -1 });
      if (result && typeof result.lean === 'function') return result.lean();
      return result || [];
    }
    return [];
  }

  async getAnnouncements() {
    const query = this.announcementModel.find({ active: true });
    if (query && typeof query.sort === 'function') {
      const limited = query.sort({ createdAt: -1 }).limit(5);
      if (limited && typeof limited.lean === 'function') {
        return limited.lean();
      }
      return limited;
    }
    return [];
  }

  async getAppointments(userId) {
    const query = this.appointmentModel.find({ userId });
    if (query && typeof query.sort === 'function') {
      const result = query.sort({ appointmentDate: 1 });
      if (result && typeof result.lean === 'function') return result.lean();
      return result || [];
    }
    return [];
  }
}

module.exports = DashboardRepository;
