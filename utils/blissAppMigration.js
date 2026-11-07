function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  const phone = String(value || '').trim();
  if (!phone) return '';
  if (/^pending-/i.test(phone)) return phone.toLowerCase();
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return phone.startsWith('+') ? `+${digits}` : digits;
}

function parseDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value || '');
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function sourceId(record, primary, fallback = '_id') {
  const value = record?.[primary] ?? record?.[fallback];
  return value == null ? '' : String(value);
}

function buildConversationId(record) {
  const key = record?.conversation_uuid ?? record?.id ?? record?._id;
  if (key == null) throw new Error('Legacy conversation is missing its identifier.');
  return `bliss-app-${encodeURIComponent(String(key))}`;
}

function buildMessageId(record) {
  const key = record?.id ?? record?._id;
  if (key == null) throw new Error('Legacy message is missing its identifier.');
  return `bliss-app-msg-${encodeURIComponent(String(key))}`;
}

function mapConversation(record, userId) {
  const conversationId = buildConversationId(record);
  const createdAt = parseDate(record.created_at ?? record.createdAt);
  const updatedAt = parseDate(record.updated_at ?? record.updatedAt ?? createdAt);
  return {
    _id: conversationId,
    id: conversationId,
    conversationId,
    departmentName:
      record.department ??
      record.department_name ??
      record.departmentName ??
      'Customer Care',
    departmentId: String(
      record.department_id ?? record.departmentId ?? 'dept-customer-care',
    ),
    userId,
    assignedStaffId:
      record.assigned_staff_id ?? record.assignedStaffId ?? null,
    status: String(record.status || 'active'),
    priority: String(record.priority || 'normal'),
    unreadCount: Number(record.unread_messages ?? record.unreadCount ?? 0),
    lastMessage: String(record.last_message ?? record.lastMessage ?? ''),
    createdAt,
    updatedAt,
    sourceBackend: 'bliss_app',
    legacyConversationId: sourceId(record, 'id'),
  };
}

function mapMessage(record, conversationId, resolveUserId = (value) => value) {
  const messageId = buildMessageId(record);
  const senderId = record.sender_id ?? record.senderId ?? '';
  const receiverId = record.receiver_id ?? record.receiverId ?? '';
  const readBy = record.read_by ?? record.readBy;
  return {
    _id: messageId,
    id: messageId,
    conversationId,
    senderId: resolveUserId(senderId) || String(senderId),
    receiverId: resolveUserId(receiverId) || String(receiverId),
    messageType: String(
      record.message_type ?? record.messageType ?? record.type ?? 'text',
    ),
    messageText: String(
      record.message_text ?? record.messageText ?? record.text ?? '',
    ),
    attachmentUrl: record.attachment_url ?? record.attachmentUrl ?? null,
    attachmentName: record.attachment_name ?? record.attachmentName ?? null,
    replyTo: record.reply_to ?? record.replyTo ?? null,
    read: Boolean(record.read ?? record.read_at ?? record.readAt ?? readBy),
    createdAt: parseDate(record.created_at ?? record.createdAt),
    updatedAt: parseDate(record.updated_at ?? record.updatedAt ?? record.created_at),
    sourceBackend: 'bliss_app',
    legacyMessageId: sourceId(record, 'id'),
  };
}

module.exports = {
  buildConversationId,
  buildMessageId,
  mapConversation,
  mapMessage,
  normalizeIdentifier,
  normalizePhone,
  parseDate,
};
