-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('WHATSAPP', 'INSTAGRAM');

-- AlterTable: converte contactPreference de TEXT para o enum, preservando
-- valores válidos e zerando qualquer valor legado fora do domínio.
ALTER TABLE "User"
  ALTER COLUMN "contactPreference" TYPE "ContactPreference"
  USING (
    CASE "contactPreference"
      WHEN 'WHATSAPP' THEN 'WHATSAPP'::"ContactPreference"
      WHEN 'INSTAGRAM' THEN 'INSTAGRAM'::"ContactPreference"
      ELSE NULL
    END
  );
