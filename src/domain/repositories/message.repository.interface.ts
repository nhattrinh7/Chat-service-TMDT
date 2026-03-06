import { Message } from '~/domain/entities/message.entity'

export interface IMessageRepository {
  findById(id: string): Promise<Message | null>
  findByConversationId(conversationId: string, cursorTimestamp?: Date, cursorId?: string, limit?: number): Promise<Message[]>
  save(message: Message): Promise<Message>
  softDelete(id: string): Promise<void>
  findLastMessageByConversationId(conversationId: string): Promise<Message | null>
}

export const MESSAGE_REPOSITORY = Symbol('IMessageRepository')
