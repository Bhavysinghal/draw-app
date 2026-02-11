-- CreateTable
CREATE TABLE "_CollabRooms" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CollabRooms_AB_unique" ON "_CollabRooms"("A", "B");

-- CreateIndex
CREATE INDEX "_CollabRooms_B_index" ON "_CollabRooms"("B");

-- AddForeignKey
ALTER TABLE "_CollabRooms" ADD CONSTRAINT "_CollabRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollabRooms" ADD CONSTRAINT "_CollabRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
