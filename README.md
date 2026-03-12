# LedgerFlow — Financial Data Transformation Platform

<div align="center">
  <h3>Stop wasting hours in Excel. Automate your financial data preparation today.</h3>
</div>

## 📌 Project Overview

**LedgerFlow** is a SaaS platform designed for the Finance and Accounting industry to automate financial data preparation and reduce manual Excel work. Finance professionals spend hours cleaning and restructuring financial data (bank statements, payment gateways, ERP exports) before they can use it for accounting systems, reports, or compliance. LedgerFlow automates this process, allowing teams to go directly from **raw data → ready-to-use financial data**.

## ✨ Core Features

- **📂 File Upload System:** Upload CSV, Excel, and JSON files via drag-and-drop.
- **🔄 Data Transformation Engine:** Map columns, convert data types, normalize dates (including Excel serial dates), and standardize currency formats.
- **🧹 Data Cleaning:** Automatically remove duplicate records and fix formatting issues.
- **📄 E-Invoice Compliance:** Validate data against Malaysia IRBM requirements for E-Invoicing.
- **⬇️ Export Options:** Export cleaned and transformed data to CSV or JSON formats.
- **💼 SaaS Dashboard:** Includes pages for Dashboard, Upload, Editor, Templates, Export, Billing, Settings, and Blueprint documentation.

## 🛠️ Technology Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 + Framer Motion for animations
- **State Management:** Zustand
- **Icons:** Lucide React
- **File Parsing:** PapaParse (CSV) & SheetJS (Excel)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js) or **pnpm**/**yarn**

### Installation Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Financial-Data-Transformation-Automation-Platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: If you encounter issues with native dependencies like better-sqlite3, you can use `npm install --ignore-scripts`)*

### Environment Variables Setup

1. Copy the example environment file to create your local `.env`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and add your Gemini API Key if you wish to use AI features:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   APP_URL="http://localhost:3000"
   ```

### Running Locally

To start the local development server:

```bash
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

## 🚢 CI/CD & Deployment Instructions

This project includes a fully configured CI/CD pipeline using **GitHub Actions**. Every time code is pushed to the `main` branch, the workflow will automatically build and deploy the application.

### Deployment via Vercel (Configured in `.github/workflows/deploy.yml`)

1. Create a project on [Vercel](https://vercel.com/).
2. Obtain your Vercel Token from Account Settings.
3. Link your project locally using Vercel CLI to get the `ORG_ID` and `PROJECT_ID`.
4. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
5. Add the following repository secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `GEMINI_API_KEY` (if using AI features)

Once configured, any push to the `main` branch will automatically trigger a deployment.

---
*Built for Finance Professionals. Empowered by Automation.*
