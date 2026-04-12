import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetUnreadCountQuery } from './get-unread-count.query'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import type { IConversationRepository } from '~/domain/repositories/conversation.repository.interface'

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepo: IConversationRepository,
  ) {}

  async execute(query: GetUnreadCountQuery) {
    const { participantId, participantType } = query

    const totalUnread = await this.conversationRepo.countUnreadConversations(
      participantId,
      participantType,
    )

    return { totalUnread }
  }
}
