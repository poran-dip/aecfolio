# AEC Profiles & CV Generator

A full-stack information system for storing verified student records with automatic CV generation.

## Stack

- **Web**: Next.js, Prisma, Auth.js, PostgreSQL
- **CV**: Hono, Puppeteer

## Prerequisites

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

## Getting Started

1. Clone the repository
    ```bash
    git clone https://github.com/poran-dip/aec-profiles.git
    cd aec-profiles
    ```

2. Set up environment variables
    ```bash
    cp web/.env.example web/.env
    ```

3. Install dependencies & start services
    ```bash
    # Web
    cd web && npm i && npm run dev

    # CV (in a separate terminal)
    cd cv && npm i && npm run dev
    ```

The web app will be available at `http://localhost:3000` and the CV service at `http://localhost:3001`.
