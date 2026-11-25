-- DropForeignKey
ALTER TABLE "NotificationToken" DROP CONSTRAINT IF EXISTS "NotificationToken_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "NotificationToken";
