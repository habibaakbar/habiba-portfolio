
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const db = require("./database");

// Load .env BEFORE reading environment variables
require("dotenv").config({
    path: path.join(__dirname, "..", ".env"),
    override: true
});





const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = 3000;

console.log(
    "Resend API key configured:",
    Boolean(process.env.RESEND_API_KEY)
);

if (!process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32) {
    throw new Error(
        "Please configure ADMIN_USERNAME, ADMIN_PASSWORD and a long SESSION_SECRET in .env"
    );
}


app.use(express.json({ limit: "1mb" }));

// Do not expose backend files, .env or the database through static hosting.
app.use((req, res, next) => {
    if (req.path.startsWith("/backend/") || req.path === "/backend") {
        return res.sendStatus(404);
    }
    next();
});

app.use(session({
    name: "habiba.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "strict",
        secure: false, // Use true when deployed behind HTTPS.
        maxAge: 2 * 60 * 60 * 1000
    }
}));

// Create the admin account if it does not exist.
async function prepareAdmin() {
    const username = process.env.ADMIN_USERNAME;
    const passwordHash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        12
    );

    const existing = db.prepare(
        "SELECT id FROM admins WHERE username = ?"
    ).get(username);

    if (!existing) {
        db.prepare(
            "INSERT INTO admins (username, password_hash) VALUES (?, ?)"
        ).run(username, passwordHash);
        console.log("Admin account created.");
    }
}

// Serve the existing portfolio without changing its design.
app.use(express.static(path.join(__dirname, "..")));

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/api/status", (req, res) => {
    res.json({
        message: "Portfolio backend is running!",
        database: "connected"
    });
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (typeof username !== "string" ||
        typeof password !== "string" ||
        username.length > 100 ||
        password.length > 200) {
        return res.status(400).json({ error: "Invalid login details." });
    }

    const admin = db.prepare(
        "SELECT * FROM admins WHERE username = ?"
    ).get(username);

    const valid = admin &&
        await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
        return res.status(401).json({ error: "Incorrect username or password." });
    }

    req.session.regenerate((err) => {
        if (err) {
            return res.status(500).json({ error: "Could not start session." });
        }

        req.session.adminId = admin.id;
        res.json({ message: "Login successful." });
    });
});

app.get("/api/me", (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Please log in." });
    }
    res.json({ authenticated: true });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed." });
        }
        res.clearCookie("habiba.sid");
        res.json({ message: "Logged out." });
    });
});

// Require login for every write operation.
function requireAdmin(req, res, next) {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Please log in first." });
    }
    next();
}



// PASTE YOUR CONTACT API HERE

app.get("/api/contact-messages", requireAdmin, (req, res) => {
    try {
        res.set("Cache-Control", "no-store");

        const messages = db.prepare(`
            SELECT
                id,
                name,
                email,
                subject,
                message,
                created_at,
                is_read
            FROM contact_messages
            ORDER BY id DESC
        `).all();

        res.json(messages);
    } catch (error) {
        console.error("Could not fetch contact messages:", error.message);

        res.status(500).json({
            error: "Unable to load contact messages."
        });
    }
});


  
const resources = {
    projects: {
        columns: ["title", "description", "technologies", "github_url", "live_url", "icon", "category"],
        required: ["title", "description"]
    },
    skills: {
        columns: ["name", "description", "icon", "sort_order"],
        required: ["name"]
    },
    certificates: {
        columns: ["title", "organization", "issue_date", "credential_url", "image_url", "description"],
        required: ["title"]
    }
};

/* Contact form: create a table for visitor messages */
db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);


/* Add read/unread status to existing contact messages */
const messageColumns = db
    .prepare("PRAGMA table_info(contact_messages)")
    .all();

const hasReadColumn = messageColumns.some(
    (column) => column.name === "is_read"
);

if (!hasReadColumn) {
    db.exec(`
        ALTER TABLE contact_messages
        ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0
    `);
}


/* Receive and save contact form messages */



app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body || {};

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof subject !== "string" ||
        typeof message !== "string"
    ) {
        return res.status(400).json({
            error: "Please fill in all fields."
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
        return res.status(400).json({
            error: "All fields are required."
        });
    }

    if (
        cleanName.length > 100 ||
        cleanEmail.length > 254 ||
        cleanSubject.length > 150 ||
        cleanMessage.length > 5000
    ) {
        return res.status(400).json({
            error: "One or more fields are too long."
        });
    }

    // Validate email address.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
        return res.status(400).json({
            error: "Please enter a valid email address."
        });
    }

    // Save the message to the database first.
    let result;

    try {
        result = db.prepare(`
            INSERT INTO contact_messages
                (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `).run(
            cleanName,
            cleanEmail,
            cleanSubject,
            cleanMessage
        );
    } catch (error) {
        console.error("Contact database error:", error.message);

        return res.status(500).json({
            error: "Unable to save your message. Please try again later."
        });
    }

    // TEST MODE: send only to your Resend account email.
    try {
        const { data, error } = await resend.emails.send({
            from: "Habiba Portfolio <onboarding@resend.dev>",
            to: ["habibaakbar062@gmail.com"],
            subject: `Portfolio Contact: ${cleanSubject}`,
            text: `You received a new portfolio message.

Name: ${cleanName}
Email: ${cleanEmail}
Subject: ${cleanSubject}

Message:
${cleanMessage}`
        });

        if (error) {
            console.error("Owner email failed:", error.message);
        } else {
            console.log("Owner notification accepted:", data.id);
        }
    } catch (error) {
        console.error("Owner email error:", error.message);
    }

    
    // Send a confirmation email to the visitor using Gmail.
    
    // Visitor confirmation email is temporarily disabled.
    // Contact messages are still saved to the database.


    return res.status(201).json({
        message: "Your message was submitted successfully!",
        id: result.lastInsertRowid
    });
});


app.patch("/api/contact-messages/:id/read", requireAdmin, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: "Invalid message ID."
        });
    }

    const result = db.prepare(`
        UPDATE contact_messages
        SET is_read = 1
        WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Message not found."
        });
    }

    res.json({
        message: "Contact message marked as read."
    });
});

app.delete("/api/contact-messages/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: "Invalid message ID."
        });
    }

    const result = db.prepare(`
        DELETE FROM contact_messages
        WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Message not found."
        });
    }

    res.json({
        message: "Contact message deleted."
    });
});

// Public read-only endpoints.
for (const [table, config] of Object.entries(resources)) {
    app.get(`/api/${table}`, (req, res) => {
        const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
        res.json(rows);
    });
}


/* Public API: Get certificates for the portfolio */
app.get("/api/certificates", (req, res) => {
    try {
        res.set("Cache-Control", "no-store");

        const certificates = db.prepare(`
            SELECT
                id,
                title,
                organization,
                issue_date,
                credential_url,
                image_url,
                description
            FROM certificates
            ORDER BY id DESC
        `).all();

        res.json(certificates);
    } catch (error) {
        console.error("Could not load certificates:", error.message);

        res.status(500).json({
            error: "Unable to load certificates."
        });
    }
});


// Protected create, update and delete endpoints.
for (const [table, config] of Object.entries(resources)) {
    app.post(`/api/${table}`, requireAdmin, (req, res) => {
        const data = req.body || {};

        for (const field of config.required) {
            if (typeof data[field] !== "string" || !data[field].trim()) {
                return res.status(400).json({ error: `${field} is required.` });
            }
        }

        for (const field of config.columns) {
            if (data[field] !== undefined &&
                !["string", "number"].includes(typeof data[field])) {
                return res.status(400).json({ error: `Invalid ${field}.` });
            }
        }

        const columns = config.columns.filter(field => data[field] !== undefined);
        const values = columns.map(field => data[field]);

        if (columns.length === 0) {
            return res.status(400).json({ error: "No data provided." });
        }

        const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        const result = db.prepare(sql).run(...values);

        res.status(201).json({
            message: "Created successfully.",
            id: result.lastInsertRowid
        });
    });

    app.put(`/api/${table}/:id`, requireAdmin, (req, res) => {
        const id = Number(req.params.id);
        const data = req.body || {};

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ error: "Invalid ID." });
        }

        for (const field of config.required) {
            if (data[field] !== undefined &&
                (typeof data[field] !== "string" || !data[field].trim())) {
                return res.status(400).json({ error: `${field} cannot be empty.` });
            }
        }

        for (const field of config.columns) {
            if (data[field] !== undefined &&
                !["string", "number"].includes(typeof data[field])) {
                return res.status(400).json({ error: `Invalid ${field}.` });
            }
        }

        const columns = config.columns.filter(field => data[field] !== undefined);

        if (!columns.length) {
            return res.status(400).json({ error: "No changes provided." });
        }

        const sql = `UPDATE ${table} SET ${columns.map(field => `${field} = ?`).join(", ")} WHERE id = ?`;
        const result = db.prepare(sql).run(...columns.map(field => data[field]), id);

        if (!result.changes) {
            return res.status(404).json({ error: "Record not found." });
        }

        res.json({ message: "Updated successfully." });
    });

    app.delete(`/api/${table}/:id`, requireAdmin, (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({ error: "Invalid ID." });
        }

        const result = db.prepare(
            `DELETE FROM ${table} WHERE id = ?`
        ).run(id);

        if (!result.changes) {
            return res.status(404).json({ error: "Record not found." });
        }

        res.json({ message: "Deleted successfully." });
    });
}


/* Get contact messages for the logged-in admin */

app.get("/api/contact-messages", requireAdmin, (req, res) => {
    try {
        const messages = db.prepare(`
            SELECT id, name, email, subject, message, created_at, is_read
            FROM contact_messages
            ORDER BY id DESC
        `).all();

        res.json(messages);
    } catch (error) {
        console.error("Could not fetch contact messages:", error.message);

        res.status(500).json({
            error: "Unable to load contact messages."
        });
    }
});


prepareAdmin()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Portfolio server running at http://localhost:${PORT}`);
            console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
        });
    })
    .catch(err => {
        console.error("Could not prepare admin account:", err.message);
        process.exit(1);
    });


 
