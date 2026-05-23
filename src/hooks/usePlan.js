import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getLimit, isAtLimit } from '../lib/plans'

export function usePlan() {
  const { user } = useAuth()
  const [plan, setPlan] = useState('free')
  const [resumeCount, setResumeCount] = useState(0)
  const [coverLetterCount, setCoverLetterCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchPlanAndUsage()
  }, [user])

  async function fetchPlanAndUsage() {
    setLoading(true)
    const [profileRes, resumesRes, clRes] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('cover_letters').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setPlan(profileRes.data?.plan ?? 'free')
    setResumeCount(resumesRes.count ?? 0)
    setCoverLetterCount(clRes.count ?? 0)
    setLoading(false)
  }

  return {
    plan,
    resumeCount,
    coverLetterCount,
    loading,
    resumeLimit: getLimit(plan, 'resumes'),
    coverLetterLimit: getLimit(plan, 'coverLetters'),
    atResumeLimit: isAtLimit(plan, 'resumes', resumeCount),
    atCoverLetterLimit: isAtLimit(plan, 'coverLetters', coverLetterCount),
    refetch: fetchPlanAndUsage,
  }
}
