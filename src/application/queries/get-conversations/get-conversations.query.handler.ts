import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetConversationsQuery } from './get-conversations.query'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import { SenderType } from '~/domain/enums/chat.enum'
import { encodeCursor, decodeCursor } from '~/shared/utils/cursor.util'

@QueryHandler(GetConversationsQuery)
export class GetConversationsHandler implements IQueryHandler<GetConversationsQuery> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
  ) {}

  async execute(query: GetConversationsQuery) {
    const { participantId, participantType, cursor, limit = 20 } = query

    // Decode compound cursor nếu có
    let cursorTimestamp: Date | undefined
    let cursorId: string | undefined
    if (cursor) {
      const decoded = decodeCursor(cursor)
      cursorTimestamp = decoded.timestamp
      cursorId = decoded.id
    }

    let conversations
    if (participantType === SenderType.USER) {
      conversations = await this.conversationRepo.findByUserId(participantId, cursorTimestamp, cursorId, limit)
    } else {
      conversations = await this.conversationRepo.findByShopId(participantId, cursorTimestamp, cursorId, limit)
    }

    const data = conversations.map(conv => ({
      id: conv.id,
      userId: conv.userId,
      shopId: conv.shopId,
      lastMessageId: conv.lastMessageId,
      lastMessageContent: conv.lastMessageContent,
      lastMessageType: conv.lastMessageType,
      lastMessageAt: conv.lastMessageAt,
      lastMessageSenderId: conv.lastMessageSenderId,
      lastMessageSenderType: conv.lastMessageSenderType,
      unreadCountUser: conv.unreadCountUser,
      unreadCountShop: conv.unreadCountShop,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }))

    // Compound cursor-based pagination meta
    const lastConv = conversations[conversations.length - 1]
    const nextCursor = conversations.length === limit && lastConv
      ? encodeCursor(lastConv.updatedAt, lastConv.id)
      : null

    return {
      data,
      meta: {
        nextCursor,
        hasMore: conversations.length === limit,
        limit,
      },
    }
  }
}
