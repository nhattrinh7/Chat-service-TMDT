import { Message as PrismaMessage } from '@prisma/client'
import { Message } from '~/domain/entities/message.entity'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'

export class MessageMapper {
  static toDomain(raw: PrismaMessage): Message {
    return Message.fromPersistence({
      id: raw.id,
      conversationId: raw.conversationId,
      senderId: raw.senderId,
      senderType: raw.senderType as SenderType,
      messageType: raw.messageType as MessageType,
      message: raw.message,
      replyToMessageId: raw.replyToMessageId,
      replyToMessageContent: raw.replyToMessageContent,
      replyToSenderType: raw.replyToSenderType as SenderType | null,
      deletedAt: raw.deletedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
