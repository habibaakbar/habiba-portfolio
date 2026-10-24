
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const db = new Database(
    path.join(__dirname, "portfolio.db"),
    { readonly: true }
);

try {
    const data = {
        projects: db.prepare("SELECT * FROM projects ORDER BY id").all(),
        skills: db.prepare("SELECT * FROM skills ORDER BY id").all(),
        certificates: db.prepare("SELECT * FROM certificates ORDER BY id").all(),
        contact_messages: db.prepare(
            "SELECT * FROM contact_messages ORDER BY id"
        ).all()
    };

    const outputPath = path.join(__dirname, "portfolio-export.json");

    fs.writeFileSync(
        outputPath,
        JSON.stringify(data, null, 2),
        "utf8"
    );

    console.log("Data exported successfully!");
    console.log("Projects:", data.projects.length);
    console.log("Skills:", data.skills.length);
    console.log("Certificates:", data.certificates.length);
    console.log("Contact messages:", data.contact_messages.length);
    console.log("File: backend/portfolio-export.json");
} catch (error) {
    console.error("Export failed:", error.message);
    process.exitCode = 1;
} finally {
    db.close();
}
