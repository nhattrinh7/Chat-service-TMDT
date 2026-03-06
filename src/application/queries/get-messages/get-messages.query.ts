export class GetMessagesQuery {
  constructor(
    public readonly conversationId: string,
    public readonly cursor?: string,
    public readonly limit?: number,
  ) {}
}
