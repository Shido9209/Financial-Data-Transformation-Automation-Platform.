import { motion } from 'motion/react';
import { Check, CreditCard, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 'RM0',
    description: 'Basic transformation for small files.',
    features: ['Limited uploads', 'Max file size 20 MB', 'Basic transformation', 'CSV export only'],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: 'RM30',
    originalPrice: 'RM50',
    description: 'For individuals and small teams.',
    features: ['Unlimited uploads', 'Max file size 200 MB', 'Column mapping tools', 'Data preview before export', 'Export to CSV and Excel'],
    cta: 'Upgrade to Starter',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'RM99',
    originalPrice: 'RM120',
    description: 'Advanced automation and compliance.',
    features: ['Everything in Starter', 'Max file size 2 GB', 'Advanced data transformation tools', 'Automation templates', 'Scheduled automation jobs', 'AI data cleaning suggestions', 'Export formats CSV, Excel, Parquet', 'Priority support'],
    cta: 'Upgrade to Pro',
    highlighted: false,
  },
];

export function Billing() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Pricing that scales with your data</h1>
        <p className="text-lg text-slate-500">Stop wasting hours in Excel. Automate your financial data preparation today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-8 rounded-3xl ${
              plan.highlighted
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105 z-10'
                : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase flex items-center gap-1 shadow-sm">
                <Zap className="w-4 h-4" /> Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
              <p className={`text-sm ${plan.highlighted ? 'text-slate-300' : 'text-slate-500'}`}>{plan.description}</p>
            </div>
            
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
              <span className={`text-sm font-medium ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>/mo</span>
              {plan.originalPrice && (
                <span className={`ml-2 text-sm line-through ${plan.highlighted ? 'text-slate-500' : 'text-slate-400'}`}>
                  {plan.originalPrice}
                </span>
              )}
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span className={`text-sm ${plan.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                plan.highlighted
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-md shadow-indigo-500/20'
                  : plan.name === 'Free'
                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
      
      <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-8 flex items-center gap-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
          <CreditCard className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 mb-1">Secure Payments</h4>
          <p className="text-slate-500 text-sm">All transactions are secure and encrypted. Cancel anytime. We accept all major credit cards and PayPal.</p>
        </div>
      </div>
    </motion.div>
  );
}
