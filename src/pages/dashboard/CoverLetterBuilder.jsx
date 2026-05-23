import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { usePlan } from '../../hooks/usePlan'
import { generateCoverLetter } from '../../lib/claude'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Sparkles, Download, RefreshCw, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CoverLetterBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { atCoverLetterLimit, coverLetterCount, coverLetterLimit } = usePlan()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resumes, setResumes] = useState([])
  const [generatedLetter, setGeneratedLetter] = useState('')
  const [form, setForm] = useState({
    selectedResumeId: '',
    jobTitle: '',
    company: '',
    jobDescription: '',
  })

  useEffect(() => {
    supabase
      .from('resumes')
      .select('id, title, content')
      .eq('user_id', user.id)
      .then(({ data }) => setResumes(data || []))
  }, [user.id])

  const updateForm = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const selectedResume = resumes.find((r) => r.id === form.selectedResumeId)

  async function handleGenerate() {
    if (!form.jobTitle || !form.company) {
      toast.error('Enter job title and company name')
      return
    }
    setLoading(true)
    try {
      const resumeData = selectedResume?.content || {
        name: user.user_metadata?.full_name || 'Applicant',
        summary: '',
        skills: [],
      }
      const letter = await generateCoverLetter({
        resumeData,
        jobTitle: form.jobTitle,
        company: form.company,
        jobDescription: form.jobDescription,
      })
      setGeneratedLetter(letter)
      toast.success('Cover letter generated!')
    } catch (err) {
      toast.error('Generation failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (atCoverLetterLimit) {
      toast.error(`Cover letter limit reached (${coverLetterCount}/${coverLetterLimit}). Upgrade your plan to save more.`)
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('cover_letters').insert({
        user_id: user.id,
        resume_id: form.selectedResumeId || null,
        job_title: form.jobTitle,
        company: form.company,
        content: generatedLetter,
      })
      if (error) throw error
      toast.success('Cover letter saved!')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedLetter)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Cover Letter Builder</h1>
        <p className="text-gray-500 mt-1">Generate a personalized cover letter for any job.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Job Details</h2></CardHeader>
          <CardBody className="space-y-4">
            {resumes.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Link to a Resume (optional)</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.selectedResumeId}
                  onChange={updateForm('selectedResumeId')}
                >
                  <option value="">Select a resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                placeholder="e.g. Frontend Engineer"
                value={form.jobTitle}
                onChange={updateForm('jobTitle')}
                required
              />
              <Input
                label="Company Name"
                placeholder="e.g. Stripe"
                value={form.company}
                onChange={updateForm('company')}
                required
              />
            </div>

            <Textarea
              label="Job Description (optional but recommended)"
              placeholder="Paste the job description for a more personalized letter..."
              rows={6}
              value={form.jobDescription}
              onChange={updateForm('jobDescription')}
            />

            <Button className="w-full" onClick={handleGenerate} loading={loading}>
              <Sparkles className="w-4 h-4" />
              {loading ? 'Writing your letter...' : 'Generate Cover Letter'}
            </Button>
          </CardBody>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your Cover Letter</h2>
            {generatedLetter && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="secondary" onClick={handleGenerate} loading={loading}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardBody>
            {generatedLetter ? (
              <div className="space-y-4">
                <Textarea
                  rows={16}
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="font-mono text-xs"
                />
                <div className="flex gap-3">
                  <Button onClick={handleSave} loading={saving} className="flex-1">
                    Save Cover Letter
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400">
                <Sparkles className="w-10 h-10 mb-3 text-gray-200" />
                <p className="text-sm">Fill in the job details and click<br />Generate Cover Letter</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
