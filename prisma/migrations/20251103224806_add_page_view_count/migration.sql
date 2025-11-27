-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "backgroundUrl" TEXT,
    "backgroundColor" TEXT,
    "location" TEXT,
    "audioUrl" TEXT,
    "cursorUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Page" ("audioUrl", "avatarUrl", "backgroundColor", "backgroundUrl", "bio", "createdAt", "cursorUrl", "id", "location", "slug", "theme", "title", "updatedAt", "userId") SELECT "audioUrl", "avatarUrl", "backgroundColor", "backgroundUrl", "bio", "createdAt", "cursorUrl", "id", "location", "slug", "theme", "title", "updatedAt", "userId" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE UNIQUE INDEX "Page_userId_key" ON "Page"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
