import { Conversation as PrismaConversation } from '@prisma/client'
import { Conversation } from '~/domain/entities/conversation.entity'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'

export class ConversationMapper {
  static toDomain(raw: PrismaConversation): Conversation {
    return Conversation.fromPersistence({
      id: raw.id,
      userId: raw.userId,
      shopId: raw.shopId,
      lastMessageId: raw.lastMessageId,
      lastMessageContent: raw.lastMessageContent,
      lastMessageType: raw.lastMessageType as MessageType | null,
      lastMessageAt: raw.lastMessageAt,
      lastMessageSenderId: raw.lastMessageSenderId,
      lastMessageSenderType: raw.lastMessageSenderType as SenderType | null,
      unreadCountUser: raw.unreadCountUser,
      unreadCountShop: raw.unreadCountShop,
      lastReadMessageIdUser: raw.lastReadMessageIdUser,
      lastReadMessageIdShop: raw.lastReadMessageIdShop,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
