import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetConversationsQuery } from './get-conversations.query'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import { SenderType } from '~/domain/enums/chat.enum'
import { encodeCursor, decodeCursor } from '~/common/utils/cursor.util'
import {
  MESSAGE_PUBLISHER,
  type IMessagePublisher,
} from '~/domain/contracts/message-publisher.interface'
import { Conversation } from '~/domain/entities/conversation.entity'

@QueryHandler(GetConversationsQuery)
export class GetConversationsHandler implements IQueryHandler<GetConversationsQuery> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(query: GetConversationsQuery) {
    const { participantId, participantType, cursor, limit = 20 } = query

    // Decode compound cursor
    let cursorTimestamp: Date | undefined
    let cursorId: string | undefined
    if (cursor) {
      const decoded = decodeCursor(cursor)
      cursorTimestamp = decoded.timestamp
      cursorId = decoded.id
    }
  
    let conversations: Conversation[] = []
    if (participantType === SenderType.USER) {
      conversations = await this.conversationRepo.findByUserId(
        participantId,
        cursorTimestamp,
        cursorId,
        limit,
      )
    } else {
      conversations = await this.conversationRepo.findByShopId(
        participantId,
        cursorTimestamp,
        cursorId,
        limit,
      )
    }

    // dùng Set lọc trùng
    // ví dụ, người gọi lần này là user thì các cuộc trò chuyện: (User_1, Shop_X),  (User_1, Shop_Y), (User_1, Shop_Z)
    // Sau qua Set: userIds = ['User_1'] và shopIds = ['Shop_X', 'Shop_Y', 'Shop_Z']
    //-----------
    // và ngược lại nếu người gọi là shop thì các cuộc trò chuyện: (User_A, Shop_1),  (User_B, Shop_1), (User_C, Shop_1)
    // Sau qua Set: shopIds = ['Shop_1'] và userIds = ['User_A', 'User_B', 'User_C']  
    const userIds = [...new Set(conversations.map(c => c.userId))]
    const shopIds = [...new Set(conversations.map(c => c.shopId))]

    let usersInfo: Array<{ id: string; username: string; avatar: string | null }> = []
    let shopsInfo: Array<{ id: string; name: string; logo: string | null }> = []

    try {
      const [users, shops] = await Promise.all([
        this.messagePublisher.sendToUserService<
          { userIds: string[] },
          Array<{ id: string; username: string; avatar: string | null }>
        >('get.users_info', { userIds }),
        this.messagePublisher.sendToShopService<
          { shopIds: string[] },
          Array<{ id: string; name: string; logo: string | null }>
        >('get.shop.simple_data', { shopIds }),
      ])
      usersInfo = users
      shopsInfo = shops
    } catch {
      usersInfo = []
      shopsInfo = []
    }

    // Tạo ra Map với key là id và value là object tương ứng
    // để khi duyệt qua conversations thì có thể truy xuất nhanh thông tin user hoặc shop thông qua id của họ
    const userMap = new Map(usersInfo.map(u => [u.id, u]))
    const shopMap = new Map(shopsInfo.map(s => [s.id, s]))
 
    const data = conversations.map(conv => {
      const user = userMap.get(conv.userId)
      const shop = shopMap.get(conv.shopId)

      return {
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
        lastReadMessageIdUser: conv.lastReadMessageIdUser,
        lastReadMessageIdShop: conv.lastReadMessageIdShop,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        userName: user?.username,
        userAvatar: user?.avatar ?? null,
        shopName: shop?.name,
        shopLogo: shop?.logo ?? null,
      }
    })

    // Compound cursor-based pagination meta
    const lastConv = conversations[conversations.length - 1]
    const nextCursor =
      conversations.length === limit && lastConv
        ? encodeCursor(lastConv.updatedAt, lastConv.id)
        : null

    return {
      data,
      meta: {
        nextCursor,
        hasMore: conversations.length === limit, // false positive
        limit,
      },
    }
  }
}
