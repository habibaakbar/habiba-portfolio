
const db = require("./database");

const skills = [
    ["Python", "Programming & AI applications", "🐍"],
    ["Artificial Intelligence", "Generative AI & AI agents", "🤖"],
    ["HTML & CSS", "Web structure & styling", "🌐"],
    ["JavaScript", "Interactive web experiences", "⚡"],
    ["Node.js & Express", "Backend web development", "🔧"],
    ["Databases", "SQLite & MongoDB", "🗄️"],
    ["LangGraph", "AI workflow orchestration", "🧠"],
    ["Streamlit", "Interactive Python applications", "🎨"]
];

const projects = [
    {
        title: "MedRoute AI",
        description: "Hospital appointment management with doctor schedules, database-verified availability and AI workflow orchestration.",
        technologies: "Python, Streamlit, LangGraph, SQLite",
        github_url: "https://github.com/habibaakbar/medroute-ai",
        icon: "🏥",
        category: "AI + Healthcare"
    },
    {
        title: "Repair Hub",
        description: "A repair service management application for managing customers, technicians and repair services.",
        technologies: "Node.js, Express.js, MongoDB, JavaScript",
        github_url: "https://github.com/habibaakbar/Repair-Hub",
        icon: "🔧",
        category: "Web Development"
    },
    {
        title: "AI Study Pack Generator",
        description: "Generates study materials, flashcards, MCQs and practice questions with AI.",
        technologies: "Python, Streamlit, Groq API",
        github_url: "https://github.com/habibaakbar/AI-Study-Pack-Generator",
        icon: "📚",
        category: "Generative AI"
    },
    {
        title: "NutriGuide AI",
        description: "An AI-powered project designed to provide personalized nutrition guidance.",
        technologies: "Python, Streamlit, Generative AI",
        github_url: "https://github.com/habibaakbar/NutriGuide-AI",
        icon: "🥗",
        category: "AI Assistant"
    },
    {
        title: "AI Content Assistant",
        description: "An AI content creation tool for helping users draft and improve written content.",
        technologies: "AI, Web Development",
        github_url: "https://github.com/habibaakbar/ai-content-assistant",
        icon: "✍️",
        category: "AI + Web"
    },
    {
        title: "Resume ATS Analyzer",
        description: "A resume analysis tool designed to help users review resumes and improve ATS compatibility.",
        technologies: "AI, Resume Analysis",
        github_url: "",
        icon: "📄",
        category: "Career Tech"
    },
    {
        title: "Thread Lens",
        description: "A project exploring thread-based content and information. More details coming soon.",
        technologies: "Project Details To Be Added",
        github_url: "",
        icon: "🧵",
        category: "Development"
    },
    {
        title: "The Elegant Machinery",
        description: "A software project. Its detailed description and technology stack will be added after confirmation.",
        technologies: "Project Details To Be Added",
        github_url: "",
        icon: "⚙️",
        category: "Development"
    },
    {
        title: "Calculator",
        description: "A simple calculator interface for performing everyday mathematical calculations.",
        technologies: "HTML, CSS, JavaScript",
        github_url: "https://github.com/habibaakbar/calculator",
        icon: "🧮",
        category: "JavaScript"
    },
    {
        title: "Stopwatch",
        description: "A timer application with stopwatch controls for tracking elapsed time.",
        technologies: "HTML, CSS, JavaScript",
        github_url: "",
        icon: "⏱️",
        category: "JavaScript"
    },
    {
        title: "Weather App",
        description: "A weather application for exploring weather information.",
        technologies: "HTML, CSS, JavaScript",
        github_url: "",
        icon: "🌦️",
        category: "Web Application"
    }
];

const insertSkill = db.prepare(`
    INSERT INTO skills (name, description, icon)
    SELECT ?, ?, ?
    WHERE NOT EXISTS (
        SELECT 1 FROM skills WHERE name = ?
    )
`);

const insertProject = db.prepare(`
    INSERT INTO projects
    (title, description, technologies, github_url, live_url, icon, category)
    SELECT ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
        SELECT 1 FROM projects WHERE title = ?
    )
`);

const seed = db.transaction(() => {
    for (const [name, description, icon] of skills) {
        insertSkill.run(name, description, icon, name);
    }

    for (const project of projects) {
        insertProject.run(
            project.title,
            project.description,
            project.technologies,
            project.github_url,
            "",
            project.icon,
            project.category,
            project.title
        );
    }
});

seed();

console.log("Skills and projects are ready in the database.");
console.log("Existing entries were not duplicated.");

db.close();
