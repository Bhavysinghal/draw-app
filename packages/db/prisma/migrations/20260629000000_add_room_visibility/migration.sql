CREATE TYPE "RoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "Room"
ADD COLUMN "visibility" "RoomVisibility" NOT NULL DEFAULT 'PRIVATE';
