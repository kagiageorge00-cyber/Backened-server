const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../auth/middleware/authMiddleware');
const InboxController = require('../controllers/inboxController');
const upload = require('../middlewares/uploadMiddleware');
const NotificationService = require('../services/notificationService');
const InboxRepository = require('../repositories/inboxRepository');
const InboxService = require('../services/inboxService');

const notificationService = new NotificationService();
const repository = new InboxRepository();
const service = new InboxService(repository, notificationService, null);
const controller = new InboxController(service);

router.get('/', authenticateToken, controller.listConversations.bind(controller));
router.get('/search', authenticateToken, controller.search.bind(controller));
router.get('/:conversationId', authenticateToken, controller.getConversation.bind(controller));
router.get('/:conversationId/messages', authenticateToken, controller.getMessages.bind(controller));
router.post('/:conversationId/messages', authenticateToken, controller.sendMessage.bind(controller));
router.put('/messages/:messageId/read', authenticateToken, controller.markRead.bind(controller));
router.put('/messages/:messageId/star', authenticateToken, controller.star.bind(controller));
router.put('/messages/:messageId/pin', authenticateToken, controller.pin.bind(controller));
router.put('/conversations/:conversationId/archive', authenticateToken, controller.archive.bind(controller));
router.delete('/messages/:messageId', authenticateToken, controller.remove.bind(controller));
router.put('/messages/:messageId/edit', authenticateToken, controller.edit.bind(controller));
router.post('/upload', authenticateToken, upload.single('file'), controller.upload.bind(controller));

module.exports = router;
