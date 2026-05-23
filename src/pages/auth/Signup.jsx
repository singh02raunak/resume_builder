import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_LABELS = { starter: 'Starter — ₹2,000', pro: 'Pro — ₹3,000' }

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const data = await signUp(form.email, form.password, form.fullName)
      if (planParam && (planParam === 'starter' || planParam === 'pro')) {
        const userId = data?.user?.id
        if (userId) {
          await supabase.from('profiles').update({ plan: planParam }).eq('id', userId)
        }
      }
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xl mb-2">
            <FileText className="w-6 h-6" />
            ResumeAI
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          {planParam && PLAN_LABELS[planParam] ? (
            <p className="text-sm mt-1 text-indigo-600 font-medium bg-indigo-50 rounded-lg px-3 py-1.5 inline-block">
              Selected: {PLAN_LABELS[planParam]}
            </p>
          ) : (
            <p className="text-gray-500 text-sm mt-1">Free forever. No credit card required.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Button type="submit" className="w-full" loading={loading}>
              {planParam && PLAN_LABELS[planParam] ? `Create Account & Activate ${planParam.charAt(0).toUpperCase() + planParam.slice(1)}` : 'Create Free Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
