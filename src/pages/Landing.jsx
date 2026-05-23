import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Button } from '../components/ui/Button'
import { FileText, Zap, Target, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Generation',
    desc: 'Enter your job title and experience — Claude AI writes a tailored, ATS-optimized resume in seconds.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Target,
    title: 'ATS Score Checker',
    desc: 'Paste any job description and instantly see how your resume scores with missing keywords highlighted.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: FileText,
    title: 'Cover Letter Builder',
    desc: 'Personalized cover letters written to match the job description — not generic copy-paste templates.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Star,
    title: 'Bullet Point Rewriter',
    desc: 'Transform weak experience bullets into impactful, metrics-driven statements with one click.',
    color: 'bg-purple-50 text-purple-600',
  },
]

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['2 resumes', '2 cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '₹2,000',
    period: 'one-time',
    features: ['10 resumes', '10 cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'],
    cta: 'Get Starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹3,000',
    period: 'one-time',
    features: ['Unlimited resumes', 'Unlimited cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'],
    cta: 'Get Pro',
    highlighted: true,
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Claude AI
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Land your dream job with an{' '}
            <span className="text-indigo-600">AI-crafted resume</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Generate ATS-optimized resumes and personalized cover letters in seconds. Built for job seekers who want results.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')} className="gap-2 shadow-md shadow-indigo-200">
              Build My Resume Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-5">No credit card required · Free forever plan</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to get hired</h2>
            <p className="text-gray-500">Powerful AI tools that give you an unfair advantage in your job search.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 flex flex-col ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2 shadow-xl shadow-indigo-200'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {plan.name}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-indigo-200' : 'text-green-500'}`} />
                      <span className={plan.highlighted ? 'text-indigo-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to land your next job?</h2>
          <p className="text-indigo-200 mb-8">Join thousands of job seekers who got hired faster with ResumeAI.</p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
          >
            Start Building for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center text-sm text-gray-400">
        © 2026 ResumeAI · Built with Claude AI
      </footer>
    </div>
  )
}
