import { AggregateRoot } from '@nestjs/cqrs'
import { v4 as uuidv4 } from 'uuid'
import { SenderType, MessageType } from '~/domain/enums/chat.enum'

interface MessageProps {
  id: string
  conversationId: string
  senderId: string
  senderType: SenderType
  messageType: MessageType
  message: string | null
  replyToMessageId: string | null
  replyToMessageContent: string | null
  replyToSenderType: SenderType | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class Message extends AggregateRoot {
  private props: MessageProps

  constructor(props: MessageProps) {
    super()
    this.props = props
  }

  get id() { return this.props.id }
  get conversationId() { return this.props.conversationId }
  get senderId() { return this.props.senderId }
  get senderType() { return this.props.senderType }
  get messageType() { return this.props.messageType }
  get message() { return this.props.message }
  get replyToMessageId() { return this.props.replyToMessageId }
  get replyToMessageContent() { return this.props.replyToMessageContent }
  get replyToSenderType() { return this.props.replyToSenderType }
  get deletedAt() { return this.props.deletedAt }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }
  get isDeleted() { return this.props.deletedAt !== null }

  static create(params: {
    conversationId: string
    senderId: string
    senderType: SenderType
    messageType: MessageType
    message: string | null
    replyToMessageId?: string | null
    replyToMessageContent?: string | null
    replyToSenderType?: SenderType | null
  }): Message {
    return new Message({
      id: uuidv4(),
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderType: params.senderType,
      messageType: params.messageType,
      message: params.message,
      replyToMessageId: params.replyToMessageId ?? null,
      replyToMessageContent: params.replyToMessageContent ?? null,
      replyToSenderType: params.replyToSenderType ?? null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static fromPersistence(props: MessageProps): Message {
    return new Message(props)
  }

  softDelete() {
    this.props.deletedAt = new Date()
    this.props.updatedAt = new Date()
  }
}