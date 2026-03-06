import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ChatController } from '~/presentation/v1/controllers/chat.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [ChatController],
  exports: [],
})
export class PresentationModule {}
