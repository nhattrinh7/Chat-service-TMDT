import { Module } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { CONVERSATION_REPOSITORY } from '~/domain/repositories/conversation.repository.interface'
import { ConversationRepository } from '~/infrastructure/database/repositories/conversation.repository'
import { MESSAGE_REPOSITORY } from '~/domain/repositories/message.repository.interface'
import { MessageRepository } from '~/infrastructure/database/repositories/message.repository'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule],
  providers: [
    PrismaService,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: ConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useClass: MessageRepository,
    },
  ],
  exports: [PrismaService, CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY],
})
export class DatabaseModule {}
