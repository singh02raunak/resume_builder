import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { usePlan } from '../../hooks/usePlan'
import { PLAN_LABELS } from '../../lib/plans'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { FileText, Mail, Plus, Trash2, Edit, Lock } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

function UsageBar({ used, limit, label }) {
  const unlimited = limit === Infinity
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{used} / {unlimited ? '∞' : limit}</span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [coverLetters, setCoverLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const { plan, resumeCount, coverLetterCount, resumeLimit, coverLetterLimit, atResumeLimit, atCoverLetterLimit } = usePlan()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    setLoading(true)
    try {
      const [resumesRes, clRes] = await Promise.all([
        supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('cover_letters').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setResumes(resumesRes.data || [])
      setCoverLetters(clRes.data || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  async function deleteResume(id) {
    await supabase.from('resumes').delete().eq('id', id)
    setResumes(resumes.filter((r) => r.id !== id))
    toast.success('Resume deleted')
  }

  async function deleteCoverLetter(id) {
    await supabase.from('cover_letters').delete().eq('id', id)
    setCoverLetters(coverLetters.filter((c) => c.id !== id))
    toast.success('Cover letter deleted')
  }

  function handleNewResume() {
    if (atResumeLimit) {
      toast.error(`You've reached your resume limit. Upgrade to create more.`)
      return
    }
    navigate('/resume/new')
  }

  function handleNewCoverLetter() {
    if (atCoverLetterLimit) {
      toast.error(`You've reached your cover letter limit. Upgrade to create more.`)
      return
    }
    navigate('/cover-letter/new')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {firstName}!</h1>
          <p className="text-gray-500 mt-1">Manage your resumes and cover letters.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-52 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {PLAN_LABELS[plan] ?? 'Free'}
            </span>
          </div>
          <div className="space-y-2.5">
            <UsageBar used={resumeCount} limit={resumeLimit} label="Resumes" />
            <UsageBar used={coverLetterCount} limit={coverLetterLimit} label="Cover Letters" />
          </div>
          {(atResumeLimit || atCoverLetterLimit) && (
            <button
              onClick={() => navigate('/')}
              className="mt-3 w-full text-xs text-center text-indigo-600 font-semibold hover:underline"
            >
              Upgrade plan →
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <button
          onClick={handleNewResume}
          disabled={atResumeLimit}
          className={`flex items-center gap-4 p-5 rounded-xl border transition-colors text-left ${
            atResumeLimit
              ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${atResumeLimit ? 'bg-gray-400' : 'bg-indigo-600'}`}>
            {atResumeLimit ? <Lock className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="font-semibold text-gray-900">Create New Resume</p>
            <p className="text-sm text-gray-500">
              {atResumeLimit ? `Limit reached (${resumeCount}/${resumeLimit}) — upgrade to add more` : 'AI-generated, ATS-optimized'}
            </p>
          </div>
        </button>

        <button
          onClick={handleNewCoverLetter}
          disabled={atCoverLetterLimit}
          className={`flex items-center gap-4 p-5 rounded-xl border transition-colors text-left ${
            atCoverLetterLimit
              ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              : 'bg-purple-50 hover:bg-purple-100 border-purple-100'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${atCoverLetterLimit ? 'bg-gray-400' : 'bg-purple-600'}`}>
            {atCoverLetterLimit ? <Lock className="w-5 h-5 text-white" /> : <Mail className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="font-semibold text-gray-900">Write Cover Letter</p>
            <p className="text-sm text-gray-500">
              {atCoverLetterLimit ? `Limit reached (${coverLetterCount}/${coverLetterLimit}) — upgrade to add more` : 'Personalized for any job'}
            </p>
          </div>
        </button>
      </div>

      {/* Resumes */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Resumes</h2>
          <Button size="sm" variant="secondary" onClick={handleNewResume} disabled={atResumeLimit}>
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>
        {loading ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : resumes.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No resumes yet.</p>
              <Button size="sm" className="mt-4" onClick={handleNewResume}>
                Create Your First Resume
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="hover:border-indigo-200 transition-colors">
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-gray-900 text-sm">{resume.title}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Updated {formatDate(resume.created_at)}</p>
                  <div className="flex gap-2 mt-auto">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/resume/${resume.id}`)}>
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteResume(resume.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Cover Letters */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Cover Letters</h2>
          <Button size="sm" variant="secondary" onClick={handleNewCoverLetter} disabled={atCoverLetterLimit}>
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>
        {loading ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : coverLetters.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No cover letters yet.</p>
              <Button size="sm" className="mt-4" onClick={handleNewCoverLetter}>
                Write Your First Cover Letter
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverLetters.map((cl) => (
              <Card key={cl.id} className="hover:border-purple-200 transition-colors">
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900 text-sm">{cl.job_title} @ {cl.company}</span>
                  </div>
                  <p className="text-xs text-gray-400">Created {formatDate(cl.created_at)}</p>
                  <div className="flex gap-2 mt-auto">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/cover-letter/${cl.id}`)}>
                      <Edit className="w-3 h-3" /> View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteCoverLetter(cl.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
