import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { openCashfreeCheckout } from '../lib/cashfree'
import { FileText, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = {
  starter: { label: 'Starter', price: '₹1', amount: 100, features: ['10 resumes', '10 cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'] },
  pro:     { label: 'Pro',     price: '₹2', amount: 200, features: ['Unlimited resumes', 'Unlimited cover letters', 'ATS score checker', 'Bullet rewriter', 'PDF export'] },
}

export default function Upgrade() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planKey = searchParams.get('plan')
  const plan = PLANS[planKey]
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle') // idle | paying | success | error

  useEffect(() => {
    if (!user) { navigate(`/login?next=/upgrade?plan=${planKey}`); return }
    if (!plan) { navigate('/'); return }
  }, [user, plan])

  async function handlePay() {
    setLoading(true)
    setStatus('paying')
    try {
      // 1. Create order on server
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, userId: user.id, userEmail: user.email }),
      })
      const { orderId, paymentSessionId, error } = await res.json()
      if (error) throw new Error(error)

      // 2. Open Cashfree checkout modal
      await openCashfreeCheckout({ paymentSessionId })

      // 3. Verify payment status on server
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const { verified, error: verifyError } = await verifyRes.json()
      if (!verified) throw new Error(verifyError || 'Payment verification failed')

      // 4. Activate plan in Supabase
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ plan: planKey })
        .eq('id', user.id)
      if (dbError) throw dbError

      setStatus('success')
      toast.success(`${plan.label} plan activated!`)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      if (err.message === 'cancelled') {
        setStatus('idle')
      } else {
        setStatus('error')
        toast.error(err.message || 'Payment failed')
      }
    } finally {
      setLoading(false)
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
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Payment successful!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">one-time</span>
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ${plan.price} & Activate`}
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 text-center cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
