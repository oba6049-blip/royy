# Vercel & MongoDB Deployment Guide for Royal Academy Portal

This project is configured out of the box for zero-config deployment on **Vercel** with **MongoDB Atlas**.

---

## Step 1: Configure MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create an account.
2. Create a database cluster (the free Shared M0 cluster works great).
3. Under **Security > Database Access**, create a database user (e.g. `royal_admin`) and password.
4. Under **Security > Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere (`0.0.0.0/0`)** — *this is required so Vercel Serverless Functions can connect to your database*.
5. Click **Database > Connect > Drivers**, copy your connection string (`mongodb+srv://...`).

---

## Step 2: Deploy to Vercel

1. Push this project code to your GitHub / GitLab repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. Import your repository.
4. Under **Environment Variables**, add the following keys:

| Environment Variable | Value |
| --- | --- |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster.mongodb.net/royal_academy?retryWrites=true&w=majority` |
| `ADMIN_EMAIL` | `fariat@gmail.com` *(or your custom admin email)* |
| `ADMIN_PASSWORD` | `Adewale_@09` *(or your custom admin password)* |

5. Click **Deploy**.

---

## Project Structure for Vercel

- **`vercel.json`**: Configures Vercel rewrites so all `/api/*` routes are handled by Vercel Serverless Functions and frontend routes load the Vite single-page application.
- **`/api/index.ts`**: The entrypoint for Vercel Serverless Functions exporting the Express API server.
- **`/server/app.ts`**: Shared Express server configuration with connection caching for MongoDB.
- **`/server/db.ts`**: Handles MongoDB driver initialization, schema collections, auto-seeding, and data operations with high-performance memory fallback.
