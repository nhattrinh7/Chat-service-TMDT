-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('USER', 'SHOP');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "last_message_id" UUID,
    "last_message_content" TEXT,
    "last_message_type" "MessageType",
    "last_message_at" TIMESTAMPTZ,
    "last_message_sender_id" UUID,
    "last_message_sender_type" "SenderType",
    "unread_count_user" INTEGER NOT NULL DEFAULT 0,
    "unread_count_shop" INTEGER NOT NULL DEFAULT 0,
    "last_read_message_id_user" UUID,
    "last_read_message_id_shop" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "message" TEXT,
    "reply_to_message_id" UUID,
    "reply_to_message_content" TEXT,
    "reply_to_sender_type" "SenderType",
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_user_id_updated_at_idx" ON "conversations"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "conversations_shop_id_updated_at_idx" ON "conversations"("shop_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_user_id_shop_id_key" ON "conversations"("user_id", "shop_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_conversation_id_deleted_at_idx" ON "messages"("conversation_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
