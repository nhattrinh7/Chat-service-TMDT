import { Conversation } from '~/domain/entities/conversation.entity'

export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>
  findByUserAndShop(userId: string, shopId: string): Promise<Conversation | null>
  findByUserId(
    userId: string,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit?: number,
  ): Promise<Conversation[]>
  findByShopId(
    shopId: string,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit?: number,
  ): Promise<Conversation[]>
  save(conversation: Conversation): Promise<Conversation>
  update(conversation: Conversation): Promise<Conversation>
  countUnreadConversations(participantId: string, participantType: 'USER' | 'SHOP'): Promise<number>
}

export const CONVERSATION_REPOSITORY = Symbol('IConversationRepository')
