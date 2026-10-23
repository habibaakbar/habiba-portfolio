
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "portfolio.db");
const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        technologies TEXT DEFAULT '',
        github_url TEXT DEFAULT '',
        live_url TEXT DEFAULT '',
        icon TEXT DEFAULT '💻',
        category TEXT DEFAULT 'Project',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '⚡',
        sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        organization TEXT DEFAULT '',
        issue_date TEXT DEFAULT '',
        credential_url TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log("Portfolio database and tables are ready!");

module.exports = db;
