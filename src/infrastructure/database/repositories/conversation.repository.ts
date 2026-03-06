import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'
import { Conversation } from '~/domain/entities/conversation.entity'
import { ConversationMapper } from '~/infrastructure/database/mappers/conversation.mapper'

@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Conversation | null> {
    const raw = await this.prisma.conversation.findUnique({ where: { id } })
    return raw ? ConversationMapper.toDomain(raw) : null
  }

  async findByUserAndShop(userId: string, shopId: string): Promise<Conversation | null> {
    const raw = await this.prisma.conversation.findUnique({
      where: { userId_shopId: { userId, shopId } },
    })
    return raw ? ConversationMapper.toDomain(raw) : null
  }

  async findByUserId(userId: string, cursorTimestamp?: Date, cursorId?: string, limit: number = 20): Promise<Conversation[]> {
    const whereClause: any = { userId }

    // Compound cursor-based pagination: lấy conversations cũ hơn cursor
    if (cursorTimestamp && cursorId) {
      whereClause.OR = [
        { updatedAt: { lt: cursorTimestamp } },
        { updatedAt: cursorTimestamp, id: { lt: cursorId } },
      ]
    }

    const results = await this.prisma.conversation.findMany({
      where: whereClause,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    })

    return results.map((r) => ConversationMapper.toDomain(r))
  }

  async findByShopId(shopId: string, cursorTimestamp?: Date, cursorId?: string, limit: number = 20): Promise<Conversation[]> {
    const whereClause: any = { shopId }

    // Compound cursor-based pagination
    if (cursorTimestamp && cursorId) {
      whereClause.OR = [
        { updatedAt: { lt: cursorTimestamp } },
        { updatedAt: cursorTimestamp, id: { lt: cursorId } },
      ]
    }

    const results = await this.prisma.conversation.findMany({
      where: whereClause,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    })

    return results.map((r) => ConversationMapper.toDomain(r))
  }

  async save(conversation: Conversation): Promise<Conversation> {
    const raw = await this.prisma.conversation.create({
      data: {
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
      },
    })
    return ConversationMapper.toDomain(raw)
  }

  async update(conversation: Conversation): Promise<Conversation> {
    const raw = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
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
      },
    })
    return ConversationMapper.toDomain(raw)
  }

  async countUnreadConversations(participantId: string, participantType: 'USER' | 'SHOP'): Promise<number> {
    if (participantType === 'USER') {
      return this.prisma.conversation.count({
        where: { userId: participantId, unreadCountUser: { gt: 0 } },
      })
    }
    return this.prisma.conversation.count({
      where: { shopId: participantId, unreadCountShop: { gt: 0 } },
    })
  }
}
