import { Module } from '@nestjs/common'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { WebsocketModule } from '~/infrastructure/websocket/websocket.module'

@Module({
  imports: [DatabaseModule, MessagingModule, WebsocketModule],
  providers: [],
  exports: [WebsocketModule],
})
export class InfrastructureModule {}
