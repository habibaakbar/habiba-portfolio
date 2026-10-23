# Habiba Akbar | AI Engineer & Web Developer

A personal portfolio website showcasing my technical skills, projects, and journey in software development and Artificial Intelligence.

## About Me

I am an Information Technology graduate from the University of Malakand with an interest in Artificial Intelligence, web development, and intelligent software solutions.

My goal is to build practical, user-focused applications that combine clean design, reliable functionality, and modern technologies.

## Features

- Professional portfolio website
- Responsive and clean user interface
- Interactive navigation with active-section highlighting
- Skills and projects sections
- Backend powered by Node.js and Express
- SQLite database integration
- Resume access
- Backend administration interface

## Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- SQLite

**Tools**
- Git and GitHub
- Visual Studio Code
- npm

## Project Structure

```text
habiba-portfolio/
├── backend/
│   ├── admin.html
│   ├── database.js
│   ├── package.json
│   ├── package-lock.json
│   ├── seed.js
│   └── server.js
├── index.html
├── style.css
├── script.js
├── resume.pdf
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/habibaakbar/habiba-portfolio.git
cd habiba-portfolio
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` directory if your backend requires environment variables.

For example, if email functionality uses Resend:

```env
RESEND_API_KEY=your_resend_api_key
```

Use your own API key locally and configure secrets securely in your hosting provider. Never commit `.env` files or expose secret keys in frontend JavaScript.

### 4. Start the backend

Run the start command configured in `backend/package.json`. If the project does not define a start script, check the server entry point and run it using Node.js.

### 5. Open the frontend

Open `index.html` using VS Code Live Server or another local web server. Backend-dependent features require the backend to be running and correctly configured.

## Deployment

Deployment is the next step. The live website URL will be added here after the frontend and backend have been deployed and tested.

**Live Website:** Coming soon

## Future Improvements

- Complete production deployment
- Improve performance and accessibility
- Strengthen backend security
- Add further projects and technical achievements

## Author

**Habiba Akbar**

AI Engineer | Web Developer

- GitHub: [habibaakbar](https://github.com/habibaakbar)
- Portfolio: Coming soon

---

*Designed and developed by Habiba Akbar.*
