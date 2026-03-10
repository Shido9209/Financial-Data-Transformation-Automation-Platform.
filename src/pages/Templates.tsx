import { motion } from 'motion/react';
import { FileJson, Plus, ArrowRight, Play, Landmark, CreditCard, ShoppingCart, Calculator, FileCheck2 } from 'lucide-react';

const templates = [
  { id: 1, name: 'Bank Statement Transformation', description: 'Removes headers, fixes dates, and standardizes amounts for ERP import.', uses: 256, icon: Landmark, category: 'Banking' },
  { id: 2, name: 'Payment Gateway Report Cleaning', description: 'Maps Stripe/PayPal payout reports to standard accounting formats.', uses: 124, icon: CreditCard, category: 'Payments' },
  { id: 3, name: 'Sales Report Restructuring', description: 'Cleans Shopify/Amazon sales data and formats for QBO/Xero import.', uses: 89, icon: ShoppingCart, category: 'E-Commerce' },
  { id: 4, name: 'Financial Reconciliation Prep', description: 'Aligns and standardizes two datasets for easy VLOOKUP or automated matching.', uses: 67, icon: Calculator, category: 'Accounting' },
  { id: 5, name: 'Malaysia IRBM e-Invoice Prep', description: 'Validates and structures data for Malaysia e-Invoice compliance (XML/JSON).', uses: 42, icon: FileCheck2, category: 'Compliance' },
];

export function Templates() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Automation Templates</h1>
          <p className="text-slate-500 mt-1">Save your transformation rules to reuse them later.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <div key={template.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 transition-colors group cursor-pointer flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    {template.category}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {template.uses} uses
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{template.name}</h3>
              <p className="text-sm text-slate-500 flex-1">{template.description}</p>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Edit Rules <ArrowRight className="w-4 h-4" />
                </button>
                <button className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  Run
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
