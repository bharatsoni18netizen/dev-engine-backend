# CodeZen - Backend API

The core backend service for **CodeZen**, powering automated AI code optimization, bug diagnosis, and code generation via Google Gemini API integration.

---

## Features
- **AI Code Review:** Evaluates code snippets and pinpoints logical and syntax errors.
- **Smart Optimization:** Refactors code for performance and readability.
- **RESTful Endpoints:** Fast JSON API architecture built using Express.js.
- **Secure Environment:** Protected API secret keys configured via `.env`.

---

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **AI Engine:** Google Gemini API
- **Middleware:** CORS, dotenv

---

## Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
