import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetMessagesQuery } from './get-messages.query'
import { MESSAGE_REPOSITORY } from '~/domain/repositories/message.repository.interface'
import type { IMessageRepository } from '~/domain/repositories/message.repository.interface'
import { encodeCursor, decodeCursor } from '~/common/utils/cursor.util'

@QueryHandler(GetMessagesQuery)
export class GetMessagesHandler implements IQueryHandler<GetMessagesQuery> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
  ) {}

  async execute(query: GetMessagesQuery) {
    const { conversationId, cursor, limit = 30 } = query

    // Decode compound cursor nếu có
    let cursorTimestamp: Date | undefined
    let cursorId: string | undefined
    if (cursor) {
      const decoded = decodeCursor(cursor)
      cursorTimestamp = decoded.timestamp
      cursorId = decoded.id
    }

    const messages = await this.messageRepo.findByConversationId(conversationId, cursorTimestamp, cursorId, limit)

    const data = messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderType: msg.senderType,
      messageType: msg.messageType,
      message: msg.isDeleted ? null : msg.message,
      replyToMessageId: msg.replyToMessageId,
      replyToMessageContent: msg.isDeleted ? null : msg.replyToMessageContent,
      replyToSenderType: msg.replyToSenderType,
      isDeleted: msg.isDeleted,
      createdAt: msg.createdAt,
    }))

    // Compound cursor: lấy message cũ nhất (đầu mảng vì đã reverse cũ→mới) để làm cursor
    const oldestMsg = messages[0]
    const nextCursor = messages.length === limit && oldestMsg
      ? encodeCursor(oldestMsg.createdAt, oldestMsg.id)
      : null

    return {
      data,
      meta: {
        nextCursor,
        hasMore: messages.length === limit,
        limit,
      },
    }
  }
}
