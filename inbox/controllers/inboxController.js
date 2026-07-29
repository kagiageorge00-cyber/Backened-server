const InboxService = require('../services/inboxService');
const InboxRepository = require('../repositories/inboxRepository');

class InboxController {
  constructor(service = null) {
    this.service = service || new InboxService(new InboxRepository());
  }

  async listConversations(req, res) {
    try {
      const result = await this.service.getConversations(req.user, req.query);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getConversation(req, res) {
    try {
      const result = await this.service.getConversationDetails(req.user, req.params.conversationId);
      const status = result.success ? 200 : 404;
      return res.status(status).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMessages(req, res) {
    try {
      const result = await this.service.getMessages(req.user, req.params.conversationId, req.query);
      const status = result.success ? 200 : 404;
      return res.status(status).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const result = await this.service.sendMessage(req.user, req.params.conversationId, req.body);
      const status = result.success ? 201 : 404;
      return res.status(status).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async markRead(req, res) {
    try {
      const result = await this.service.markMessageRead(req.user, req.params.messageId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async star(req, res) {
    try {
      const result = await this.service.starMessage(req.user, req.params.messageId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async pin(req, res) {
    try {
      const result = await this.service.pinMessage(req.user, req.params.messageId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async archive(req, res) {
    try {
      const result = await this.service.archiveConversation(req.user, req.params.conversationId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async remove(req, res) {
    try {
      const result = await this.service.deleteMessage(req.user, req.params.messageId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async edit(req, res) {
    try {
      const result = await this.service.editMessage(req.user, req.params.messageId, req.body.text);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async upload(req, res) {
    try {
      const result = await this.service.uploadAttachment(req.user, req.file || req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async search(req, res) {
    try {
      const result = await this.service.search(req.user, req.query.q);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = InboxController;
