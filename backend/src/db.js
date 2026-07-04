import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the absolute path to the SQLite database file in the backend directory
const dbPath = path.resolve(__dirname, "../dev.db");

// Instantiate the adapter with the connection URL object
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

// Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

export default prisma;
