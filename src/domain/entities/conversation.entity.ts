import { v4 as uuidv4 } from 'uuid'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'

interface ConversationProps {
  id: string
  userId: string
  shopId: string
  lastMessageId: string | null
  lastMessageContent: string | null
  lastMessageType: MessageType | null
  lastMessageAt: Date | null
  lastMessageSenderId: string | null
  lastMessageSenderType: SenderType | null
  unreadCountUser: number
  unreadCountShop: number
  lastReadMessageIdUser: string | null
  lastReadMessageIdShop: string | null
  createdAt: Date
  updatedAt: Date
}

export class Conversation {
  private constructor(private props: ConversationProps) {}

  get id() { return this.props.id }
  get userId() { return this.props.userId }
  get shopId() { return this.props.shopId }
  get lastMessageId() { return this.props.lastMessageId }
  get lastMessageContent() { return this.props.lastMessageContent }
  get lastMessageType() { return this.props.lastMessageType }
  get lastMessageAt() { return this.props.lastMessageAt }
  get lastMessageSenderId() { return this.props.lastMessageSenderId }
  get lastMessageSenderType() { return this.props.lastMessageSenderType }
  get unreadCountUser() { return this.props.unreadCountUser }
  get unreadCountShop() { return this.props.unreadCountShop }
  get lastReadMessageIdUser() { return this.props.lastReadMessageIdUser }
  get lastReadMessageIdShop() { return this.props.lastReadMessageIdShop }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  static create(userId: string, shopId: string): Conversation {
    return new Conversation({
      id: uuidv4(),
      userId,
      shopId,
      lastMessageId: null,
      lastMessageContent: null,
      lastMessageType: null,
      lastMessageAt: null,
      lastMessageSenderId: null,
      lastMessageSenderType: null,
      unreadCountUser: 0,
      unreadCountShop: 0,
      lastReadMessageIdUser: null,
      lastReadMessageIdShop: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static fromPersistence(props: ConversationProps): Conversation {
    return new Conversation(props)
  }

  updateLastMessage(messageId: string, content: string | null, type: MessageType, senderId: string, senderType: SenderType) {
    this.props.lastMessageId = messageId
    this.props.lastMessageContent = content
    this.props.lastMessageType = type
    this.props.lastMessageAt = new Date()
    this.props.lastMessageSenderId = senderId
    this.props.lastMessageSenderType = senderType
    this.props.updatedAt = new Date()
  }

  incrementUnreadForUser() {
    this.props.unreadCountUser += 1
  }

  incrementUnreadForShop() {
    this.props.unreadCountShop += 1
  }

  markAsReadByUser(lastReadMessageId: string) {
    this.props.unreadCountUser = 0
    this.props.lastReadMessageIdUser = lastReadMessageId
  }

  markAsReadByShop(lastReadMessageId: string) {
    this.props.unreadCountShop = 0
    this.props.lastReadMessageIdShop = lastReadMessageId
  }
}
