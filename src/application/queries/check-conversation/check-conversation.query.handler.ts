import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CheckConversationQuery } from './check-conversation.query'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import {
  MESSAGE_PUBLISHER,
  type IMessagePublisher,
} from '~/domain/contracts/message-publisher.interface'

@QueryHandler(CheckConversationQuery)
export class CheckConversationHandler implements IQueryHandler<CheckConversationQuery> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(query: CheckConversationQuery) {
    const { userId, shopId } = query

    const conversation = await this.conversationRepo.findByUserAndShop(userId, shopId)
    if (!conversation) return null

    let userInfo: { id: string; username: string; avatar: string | null } | null = null
    let shopInfo: { id: string; name: string; logo: string | null } | null = null

    const [users, shops] = await Promise.all([
      this.messagePublisher.sendToUserService<
        { userIds: string[] },
        Array<{ id: string; username: string; avatar: string | null }>
      >('get.users_info', { userIds: [userId] }),
      this.messagePublisher.sendToShopService<
        { shopIds: string[] },
        Array<{ id: string; name: string; logo: string | null }>
      >('get.shop.simple_data', { shopIds: [shopId] }),
    ])
    userInfo = users[0] || null
    shopInfo = shops[0] || null

    return {
      id: conversation.id,
      userId: conversation.userId,
      shopId: conversation.shopId,
      lastMessageId: conversation.lastMessageId,
      lastMessageContent: conversation.lastMessageContent,
      lastMessageType: conversation.lastMessageType,
      lastMessageAt: conversation.lastMessageAt,
      lastMessageSenderId: conversation.lastMessageSenderId,
      lastMessageSenderType: conversation.lastMessageSenderType,
      unreadCountUser: conversation.unreadCountUser,
      unreadCountShop: conversation.unreadCountShop,
      lastReadMessageIdUser: conversation.lastReadMessageIdUser,
      lastReadMessageIdShop: conversation.lastReadMessageIdShop,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      userName: userInfo?.username,
      userAvatar: userInfo?.avatar ?? null,
      shopName: shopInfo?.name,
      shopLogo: shopInfo?.logo ?? null,
    }
  }
}
