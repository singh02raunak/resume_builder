import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { FileText, CheckCircle, Loader, CreditCard, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = {
  starter: { label: 'Starter', price: '₹1', features: ['10 resumes', '10 cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'] },
  pro:     { label: 'Pro',     price: '₹2', features: ['Unlimited resumes', 'Unlimited cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'] },
}

export default function Upgrade() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planKey = searchParams.get('plan')
  const plan = PLANS[planKey]
  const [status, setStatus] = useState('idle') // idle | processing | success
  const [form, setForm] = useState({ card: '', expiry: '', cvv: '', name: '' })

  useEffect(() => {
    if (!user) { navigate(`/login?next=/upgrade?plan=${planKey}`); return }
    if (!plan) { navigate('/'); return }
  }, [user, plan])

  function formatCard(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  }

  async function handlePay(e) {
    e.preventDefault()
    setStatus('processing')
    try {
      // Mock payment — simulates gateway delay
      await new Promise((res) => setTimeout(res, 2000))

      // Activate plan in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ plan: planKey })
        .eq('id', user.id)
      if (error) throw error

      setStatus('success')
      toast.success(`${plan.label} plan activated!`)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setStatus('idle')
      toast.error(err.message || 'Payment failed')
    }
  }

  if (!plan || !user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xl mb-2">
            <FileText className="w-6 h-6" />
            ResumeAI
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Activate {plan.label} Plan</h1>
          <p className="text-gray-500 text-sm mt-1">One-time payment · No subscription</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {status === 'success' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 text-lg">Payment successful!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              {/* Plan summary */}
              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">{plan.label} Plan</span>
                  <span className="text-xl font-extrabold text-indigo-600">{plan.price}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card form */}
              <form onSubmit={handlePay} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Name on card</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Card number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4111 1111 1111 1111"
                      required
                      value={form.card}
                      onChange={(e) => setForm({ ...form, card: formatCard(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 pr-10"
                    />
                    <CreditCard className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      required
                      value={form.expiry}
                      onChange={(e) => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={3}
                      required
                      value={form.cvv}
                      onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'processing'}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {status === 'processing'
                    ? <><Loader className="w-4 h-4 animate-spin" /> Processing...</>
                    : <><Lock className="w-4 h-4" /> Pay {plan.price} & Activate</>}
                </button>
              </form>

              <button
                onClick={() => navigate('/')}
                className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 text-center cursor-pointer"
              >
                Cancel
              </button>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Secured · Test mode
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
