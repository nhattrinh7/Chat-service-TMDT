import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IMessageRepository } from '~/domain/repositories/message.repository.interface'
import { Message } from '~/domain/entities/message.entity'
import { MessageMapper } from '~/infrastructure/database/mappers/message.mapper'

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Message | null> {
    const raw = await this.prisma.message.findUnique({ where: { id } })
    return raw ? MessageMapper.toDomain(raw) : null
  }

  async findByConversationId(
    conversationId: string,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit: number = 30,
  ): Promise<Message[]> {
    const whereClause: any = { conversationId }

    // Compound cursor-based: lấy messages cũ hơn cursor (scroll up to load more)
    if (cursorTimestamp && cursorId) {
      whereClause.OR = [
        { createdAt: { lt: cursorTimestamp } },
        { createdAt: cursorTimestamp, id: { lt: cursorId } },
      ]
    }

    const results = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    })

    // Trả về theo thứ tự cũ → mới để FE render đúng thứ tự
    return results.reverse().map(r => MessageMapper.toDomain(r))
  }

  async save(message: Message): Promise<Message> {
    const raw = await this.prisma.message.create({
      data: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderType: message.senderType,
        messageType: message.messageType,
        message: message.message,
        replyToMessageId: message.replyToMessageId,
        replyToMessageContent: message.replyToMessageContent,
        replyToSenderType: message.replyToSenderType,
        deletedAt: message.deletedAt,
      },
    })
    return MessageMapper.toDomain(raw)
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async findLastMessageByConversationId(conversationId: string): Promise<Message | null> {
    const raw = await this.prisma.message.findFirst({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return raw ? MessageMapper.toDomain(raw) : null
  }
}
