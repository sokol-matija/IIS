import path from 'path'

// Set test environment variables BEFORE any module that uses them is loaded.
// Prisma SQLite resolves relative paths from the schema.prisma directory (backend/prisma/).
// So "file:./test.db" means backend/prisma/test.db.
process.env.DATABASE_URL = 'file:./test.db'
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key'
process.env.USE_CUSTOM_API = 'true'
