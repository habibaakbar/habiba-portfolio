
console.log("Habiba's portfolio is running!");

const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
    const savedTheme = localStorage.getItem("portfolio-theme");
    const preferredTheme = window.matchMedia(
        "(prefers-color-scheme: light)"
    ).matches ? "light" : "dark";

    function applyTheme(theme) {
        document.body.dataset.theme = theme;

        const isLight = theme === "light";

        themeToggle.textContent = isLight ? "🌙" : "☀️";
        themeToggle.setAttribute(
            "aria-label",
            isLight ? "Switch to dark theme" : "Switch to light theme"
        );

        localStorage.setItem("portfolio-theme", theme);
    }

    applyTheme(savedTheme || preferredTheme);

    themeToggle.addEventListener("click", () => {
        const currentTheme = document.body.dataset.theme;
        applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
}

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
        menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuToggle.textContent = "☰";
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        });
    });
}


/* Load portfolio data from the backend API */


async function loadPortfolioData() {
    try {
        const [
            projectsResponse,
            skillsResponse,
            certificatesResponse
        ] = await Promise.all([
            fetch("/api/projects"),
            fetch("/api/skills"),
            fetch("/api/certificates", { cache: "no-store" })
        ]);

        if (
            !projectsResponse.ok ||
            !skillsResponse.ok ||
            !certificatesResponse.ok
        ) {
            throw new Error("Could not load portfolio data.");
        }

        const projects = await projectsResponse.json();
        const skills = await skillsResponse.json();
        const certificates = await certificatesResponse.json();

        renderProjects(projects);
        renderSkills(skills);
        renderCertificates(certificates);

    } catch (error) {
        console.error(
            "Portfolio data could not be loaded:",
            error
        );
    }
}


function renderProjects(projects) {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;

    grid.replaceChildren();

    projects.forEach((project) => {
        const card = document.createElement("article");
        card.className = "project-card";

        const top = document.createElement("div");
        top.className = "project-top";

        const icon = document.createElement("span");
        icon.className = "project-icon";
        icon.textContent = project.icon || "💻";

        const category = document.createElement("span");
        category.className = "project-category";
        category.textContent = project.category || "Project";

        top.append(icon, category);

        const title = document.createElement("h3");
        title.textContent = project.title;

        const description = document.createElement("p");
        description.textContent = project.description;

        const tags = document.createElement("div");
        tags.className = "tech-tags";

        (project.technologies || "")
            .split(",")
            .map((tech) => tech.trim())
            .filter(Boolean)
            .forEach((tech) => {
                const tag = document.createElement("span");
                tag.textContent = tech;
                tags.appendChild(tag);
            });

        card.append(top, title, description, tags);

        const url = project.live_url || project.github_url;

        if (url) {
            const link = document.createElement("a");
            link.className = "project-link";
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "View Project ↗";
            card.appendChild(link);
        }

        grid.appendChild(card);
    });
}

function renderSkills(skills) {
    const grid = document.getElementById("skills-grid");
    if (!grid) return;

    grid.replaceChildren();

    skills.forEach((skill) => {
        const card = document.createElement("div");
        card.className = "skill-card";

        const icon = document.createElement("span");
        icon.className = "skill-icon";
        icon.textContent = skill.icon || "⚡";

        const title = document.createElement("h3");
        title.textContent = skill.name;

        const description = document.createElement("p");
        description.textContent = skill.description || "";

        card.append(icon, title, description);
        grid.appendChild(card);
    });
}

function renderCertificates(certificates) {
    const grid = document.getElementById("certificates-grid");
    if (!grid) return;

    grid.replaceChildren();

    if (!certificates.length) {
        grid.textContent = "Certificates will be added soon.";
        return;
    }

    certificates.forEach((certificate) => {
        const card = document.createElement("article");
        card.className = "certificate-card";

        const title = document.createElement("h3");
        title.textContent = certificate.title;
        card.appendChild(title);

        const organization = document.createElement("p");
        organization.textContent = certificate.organization || "";
        card.appendChild(organization);

        if (certificate.issue_date) {
            const date = document.createElement("p");
            date.textContent = `Issued: ${certificate.issue_date}`;
            card.appendChild(date);
        }

        if (certificate.credential_url) {
            const link = document.createElement("a");
            link.href = certificate.credential_url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Verify Certificate ↗";
            card.appendChild(link);
        }

        grid.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", loadPortfolioData);



// contact form submission handling
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");
    const submitButton = document.getElementById("send-message-btn");
    const submitLabel = submitButton?.querySelector(".submit-label");

    if (!form || !status || !submitButton) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);

        const data = {
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim(),
            subject: String(formData.get("subject") || "").trim(),
            message: String(formData.get("message") || "").trim()
        };

        if (Object.values(data).some(value => !value)) {
            status.textContent = "Please complete all fields.";
            status.style.color = "#ff9999";
            return;
        }

        submitButton.disabled = true;
        if (submitLabel) submitLabel.textContent = "Sending...";
        status.textContent = "";

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();

let result = {};

try {
    result = responseText ? JSON.parse(responseText) : {};
} catch {
    throw new Error(
        `Invalid server response (HTTP ${response.status}): ` +
        (responseText || "Empty response")
    );
}

if (!response.ok) {
    throw new Error(
        result.error ||
        result.message ||
        `Request failed with status ${response.status}`
    );
}

if (!responseText) {
    throw new Error("Server returned an empty response.");
}

            if (!responseText) {
                throw new Error(
                    `The server returned an empty response (HTTP ${response.status}).`
                );
            }

            status.style.color = "#66d9bd";
            status.textContent =
                result.message || "Your message was sent successfully!";

            form.reset();
        } catch (error) {
            status.style.color = "#ff9999";
            status.textContent =
                error.message === "Failed to fetch"
                    ? "Connection error. Please try again."
                    : error.message || "Something went wrong.";
        } finally {
            submitButton.disabled = false;
            if (submitLabel) submitLabel.textContent = "Send Message";
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(
        '#nav-links a[href^="#"]'
    );

    const sections = Array.from(navLinks)
        .map((link) => {
            const id = link.getAttribute("href").slice(1);
            return document.getElementById(id);
        })
        .filter(Boolean);

    function updateActiveLink() {
        if (!sections.length) return;

        const activationPoint = window.innerHeight * 0.35;
        let currentSection = sections[0];

        for (const section of sections) {
            const top = section.getBoundingClientRect().top;

            if (top <= activationPoint) {
                currentSection = section;
            } else {
                break;
            }
        }

        // Keep the final section active at the bottom of the page.
        if (
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2
        ) {
            currentSection = sections[sections.length - 1];
        }

        navLinks.forEach((link) => {
            const active =
                link.getAttribute("href") === `#${currentSection.id}`;

            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    window.addEventListener("scroll", updateActiveLink, {
        passive: true
    });

    window.addEventListener("resize", updateActiveLink);

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            requestAnimationFrame(updateActiveLink);
        });
    });

    updateActiveLink();
});
