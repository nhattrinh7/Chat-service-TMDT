import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { WebsocketModule } from '~/infrastructure/websocket/websocket.module'
import { CloudinaryService } from '~/common/services/cloudinary.service'

import { SendMessageHandler } from './commands/send-message/send-message.command.handler'
import { MarkAsReadHandler } from './commands/mark-as-read/mark-as-read.command.handler'
import { DeleteMessageHandler } from './commands/delete-message/delete-message.command.handler'
import { GetConversationsHandler } from './queries/get-conversations/get-conversations.query.handler'
import { GetMessagesHandler } from './queries/get-messages/get-messages.query.handler'
import { GetUnreadCountHandler } from './queries/get-unread-count/get-unread-count.query.handler'
import { CheckConversationHandler } from './queries/check-conversation/check-conversation.query.handler'

const CommandHandlers = [SendMessageHandler, MarkAsReadHandler, DeleteMessageHandler]

const QueryHandlers = [GetConversationsHandler, GetMessagesHandler, GetUnreadCountHandler, CheckConversationHandler]

const EventHandlers = []

@Module({
  imports: [CqrsModule, DatabaseModule, MessagingModule, WebsocketModule],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers, CloudinaryService],
  exports: [],
})
export class ApplicationModule {}
