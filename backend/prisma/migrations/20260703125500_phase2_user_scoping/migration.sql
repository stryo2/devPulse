-- Remove duplicate connected platform rows before adding the unique constraint.
WITH ranked_connected_platforms AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "platform"
      ORDER BY "createdAt" DESC, "id" DESC
    ) AS rn
  FROM "ConnectedPlatform"
)
DELETE FROM "ConnectedPlatform"
WHERE ctid IN (
  SELECT ctid
  FROM ranked_connected_platforms
  WHERE rn > 1
);

ALTER TABLE "ConnectedPlatform"
  ALTER COLUMN "accessToken" DROP NOT NULL;

ALTER TABLE "ActivitySnapshot"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceKey" TEXT;

ALTER TABLE "ActivitySnapshot"
  ADD CONSTRAINT "ActivitySnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ConnectedPlatform_userId_platform_key"
  ON "ConnectedPlatform"("userId", "platform");

CREATE UNIQUE INDEX "ActivitySnapshot_userId_platform_sourceKey_key"
  ON "ActivitySnapshot"("userId", "platform", "sourceKey");

CREATE INDEX "ActivitySnapshot_userId_timestamp_idx"
  ON "ActivitySnapshot"("userId", "timestamp");