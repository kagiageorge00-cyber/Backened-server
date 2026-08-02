const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

router.post('/login', staffController.login);
router.get('/accounts', staffController.listStaffAccounts);
router.get('/dashboard', staffController.dashboard);
router.get('/chats', staffController.listChats);
router.get('/chats/:id', staffController.getChatById);
router.post('/chats/send', staffController.sendMessage);
router.post('/chats/upload', staffController.uploadFile);
router.put('/chats/assign', staffController.assignConversation);
router.put('/chats/transfer', staffController.transferConversation);
router.post('/chats/internal-note', staffController.addInternalNote);
router.post('/broadcast', staffController.broadcast);
router.post('/campaigns/send', staffController.broadcast);
router.get('/notifications', staffController.fetchNotifications);
router.get('/performance', staffController.performance);
router.get('/staff/performance', staffController.performance);

router.get('/applications', staffController.listApplications);
router.put('/applications/:id', staffController.updateApplication);
router.get('/candidates/pending', staffController.listPendingCandidates);
router.put('/candidates/:id/complete', staffController.completeCandidate);
router.get('/employers', staffController.listEmployers);
router.post('/employers/register', staffController.registerEmployer);
router.get('/agents', staffController.listAgents);
router.post('/agents/register', staffController.registerAgent);
router.get('/bookings', staffController.listBookings);
router.put('/bookings/:id/status', staffController.updateBookingStatus);
router.get('/support/tickets', staffController.listSupportTickets);
router.post('/support/tickets/:id/respond', staffController.respondSupportTicket);
router.get('/assignments', staffController.listAssignments);
router.post('/marketplace/jobs', staffController.postMarketplaceJob);
router.get('/marketplace/jobs', staffController.listJobs);

module.exports = router;
