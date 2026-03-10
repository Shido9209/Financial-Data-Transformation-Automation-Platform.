import { motion } from 'motion/react';
import { FileText, CheckCircle2, Database, Server, DollarSign, Target } from 'lucide-react';

export function Blueprint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="border-b border-slate-200 pb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">SaaS Product Blueprint: LedgerFlow</h1>
        <p className="text-xl text-slate-500">Financial Data Transformation & Automation Platform</p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <Target className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-900">1. Product Overview</h2>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600">
          <p><strong>LedgerFlow</strong> is a SaaS platform designed for the Finance and Accounting industry to automate financial data preparation and reduce manual Excel work.</p>
          <p>Finance professionals spend hours cleaning and restructuring financial data (bank statements, payment gateways, ERP exports) before they can use it for accounting systems, reports, or compliance. LedgerFlow automates this process, allowing teams to go directly from <strong>raw data → ready-to-use financial data</strong>.</p>
          <p><strong>Target Customers:</strong> Accounting firms, SME finance departments, Bookkeepers, Financial analysts, Audit teams.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-900">2. Core Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">File Upload System</h3>
            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>Upload CSV, Excel, JSON, and XML files</li>
              <li>Drag-and-drop upload interface</li>
              <li>File size limits depending on pricing plan</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Data Transformation Engine</h3>
            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>Column mapping & renaming</li>
              <li>Data type conversion</li>
              <li>Date format normalization</li>
              <li>Currency format standardization</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Data Cleaning Engine</h3>
            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>Remove duplicate records</li>
              <li>Fix formatting issues</li>
              <li>Detect missing values</li>
              <li>Validate financial data fields</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">AI & Automation</h3>
            <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>AI automatic column mapping</li>
              <li>AI data cleaning suggestions</li>
              <li>Bank statement & payment gateway transformation</li>
              <li>E-Invoice compliance automation (e.g., Malaysia IRBM)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <FileText className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">3. MVP Feature List</h2>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-amber-900">
          <p className="font-medium mb-4">The Minimum Viable Product (MVP) focuses on the core value proposition:</p>
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li><strong>Upload:</strong> CSV and Excel file support (up to 50MB).</li>
            <li><strong>Transform:</strong> Manual column mapping, renaming, and basic date/currency formatting.</li>
            <li><strong>Clean:</strong> Remove duplicates and highlight missing values.</li>
            <li><strong>Export:</strong> Download cleaned data as CSV or Excel.</li>
            <li><strong>Templates:</strong> Save mapping rules for future use.</li>
            <li><strong>Billing:</strong> Stripe integration for Starter and Pro plans.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <Server className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">4. Technical Architecture</h2>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600">
          <p>A modern, scalable architecture designed for data processing:</p>
          <ul>
            <li><strong>Frontend:</strong> React (Vite), Tailwind CSS, Framer Motion, React Router. Hosted on Vercel or Cloud Run.</li>
            <li><strong>Backend:</strong> Node.js with Express or NestJS. Handles API requests, authentication, and job queuing.</li>
            <li><strong>File Processing Engine:</strong> Python microservice (Pandas/Polars) or Rust/Go for high-performance data manipulation. Uses message queues (RabbitMQ/Redis) for async processing of large files.</li>
            <li><strong>Storage:</strong> AWS S3 or Google Cloud Storage for temporary file storage (auto-deleted after 24h for security).</li>
            <li><strong>AI Integration:</strong> OpenAI API or Google Gemini for column mapping and cleaning suggestions.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <Database className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">5. Database Design</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-4 border border-slate-200 font-semibold">Table</th>
                <th className="p-4 border border-slate-200 font-semibold">Description & Key Fields</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr>
                <td className="p-4 border border-slate-200 font-medium text-slate-900">Users</td>
                <td className="p-4 border border-slate-200">id, email, password_hash, company_name, role, created_at</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-4 border border-slate-200 font-medium text-slate-900">Subscriptions</td>
                <td className="p-4 border border-slate-200">id, user_id, plan_tier (free/starter/pro), stripe_customer_id, status, current_period_end</td>
              </tr>
              <tr>
                <td className="p-4 border border-slate-200 font-medium text-slate-900">UploadedFiles</td>
                <td className="p-4 border border-slate-200">id, user_id, original_name, storage_url, size_bytes, format, uploaded_at</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-4 border border-slate-200 font-medium text-slate-900">AutomationTemplates</td>
                <td className="p-4 border border-slate-200">id, user_id, name, description, mapping_rules (JSON), is_public</td>
              </tr>
              <tr>
                <td className="p-4 border border-slate-200 font-medium text-slate-900">TransformationJobs</td>
                <td className="p-4 border border-slate-200">id, user_id, file_id, template_id, status (pending/processing/completed/failed), rows_processed, errors (JSON)</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-4 border border-slate-200 font-medium text-slate-900">ExportHistory</td>
                <td className="p-4 border border-slate-200">id, job_id, user_id, format, download_url, exported_at</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-900">6. Pricing & Monetization Strategy</h2>
        </div>
        <div className="prose prose-slate max-w-none text-slate-600">
          <p><strong>Pricing Model:</strong></p>
          <ul>
            <li><strong>Free (RM0/mo):</strong> Limited uploads, 20MB max, basic transformation, CSV export.</li>
            <li><strong>Starter (RM30/mo - Limited Offer):</strong> Unlimited uploads, 200MB max, column mapping, CSV/Excel export.</li>
            <li><strong>Pro (RM99/mo - Limited Offer):</strong> 2GB max, advanced tools, automation templates, scheduled jobs, AI suggestions, Parquet/XML export, priority support.</li>
          </ul>
          
          <p><strong>Monetization Strategy:</strong></p>
          <ol>
            <li><strong>Attract Early Customers:</strong> Target bookkeeping communities and accounting firms on LinkedIn. Offer the "Limited Offer Price" to create urgency and secure early adopters. Provide free webinars on "Automating Excel for Accountants".</li>
            <li><strong>Convert Free to Paid:</strong> Implement a product-led growth (PLG) strategy. Let free users experience the "Aha!" moment (seeing their messy data cleaned instantly), but gate the export of large files or Excel formats behind the Starter plan.</li>
            <li><strong>Grow MRR:</strong> Upsell Starter users to Pro by highlighting time saved with Automation Templates and AI features. Introduce team seats for accounting firms (B2B enterprise sales).</li>
          </ol>
        </div>
      </section>
    </motion.div>
  );
}
