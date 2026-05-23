import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../../hooks/usePlan'
import { scoreATS } from '../../lib/claude'
import { Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Upload, Target, FileText, ArrowUpCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item) => item.str).join(' ') + '\n'
  }
  return text.trim()
}

export default function ResumeBuilder() {
  const navigate = useNavigate()
  const { plan } = usePlan()

  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [fileName, setFileName] = useState('')
  const [atsResult, setAtsResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setAtsResult(null)

    if (file.type === 'application/pdf') {
      setExtracting(true)
      try {
        const text = await extractTextFromPDF(file)
        setResumeText(text)
        toast.success('Resume text extracted!')
      } catch {
        toast.error('Could not read PDF. Try pasting your resume text below.')
      } finally {
        setExtracting(false)
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      setResumeText(text)
      toast.success('Resume loaded!')
    } else {
      toast.error('Please upload a PDF or .txt file')
    }
  }

  async function handleCheckATS() {
    if (!resumeText.trim()) { toast.error('Upload or paste your resume first'); return }
    if (!jobDescription.trim()) { toast.error('Paste a job description to compare against'); return }

    setLoading(true)
    try {
      const result = await scoreATS({ resumeText, jobDescription })
      setAtsResult(result)
    } catch (err) {
      toast.error('ATS check failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResumeText('')
    setJobDescription('')
    setFileName('')
    setAtsResult(null)
  }

  const scoreColor = atsResult
    ? atsResult.score >= 70 ? 'text-green-600' : atsResult.score >= 50 ? 'text-amber-500' : 'text-red-500'
    : ''

  const scoreLabel = atsResult
    ? atsResult.score >= 70 ? 'Strong match — good to apply!' : atsResult.score >= 50 ? 'Fair match — some improvements needed' : 'Low match — resume needs work'
    : ''

  const showUpgradeNudge = atsResult && atsResult.score < 60 && plan === 'free'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ATS Resume Checker</h1>
        <p className="text-gray-500 mt-1">Upload your resume and a job description — get your ATS score instantly.</p>
      </div>

      {!atsResult ? (
        <div className="space-y-5">
          {/* Upload */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Your Resume</h2></CardHeader>
            <CardBody className="space-y-4">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${fileName ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}>
                <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} />
                {extracting ? (
                  <><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-2" /><p className="text-sm text-indigo-600">Extracting text...</p></>
                ) : fileName ? (
                  <><FileText className="w-6 h-6 text-indigo-500 mb-2" /><p className="text-sm font-medium text-indigo-700">{fileName}</p><p className="text-xs text-indigo-400 mt-1">Click to change file</p></>
                ) : (
                  <><Upload className="w-6 h-6 text-gray-400 mb-2" /><p className="text-sm text-gray-500">Click to upload <span className="font-medium text-indigo-600">PDF</span> or <span className="font-medium text-indigo-600">.txt</span></p></>
                )}
              </label>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or paste resume text</span></div>
              </div>

              <Textarea
                placeholder="Paste your resume content here..."
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </CardBody>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Job Description</h2></CardHeader>
            <CardBody>
              <Textarea
                placeholder="Paste the job description you're applying for..."
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </CardBody>
          </Card>

          <Button className="w-full" onClick={handleCheckATS} loading={loading}>
            <Target className="w-4 h-4" />
            {loading ? 'Analyzing your resume...' : 'Check ATS Score'}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Score card */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-6 mb-6">
                <div className={`text-6xl font-extrabold ${scoreColor}`}>{atsResult.score}%</div>
                <div>
                  <p className="font-semibold text-gray-900">ATS Match Score</p>
                  <p className="text-sm text-gray-500 mt-1">{scoreLabel}</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className={`h-full rounded-full transition-all ${atsResult.score >= 70 ? 'bg-green-500' : atsResult.score >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${atsResult.score}%` }}
                />
              </div>

              {/* Upgrade nudge */}
              {showUpgradeNudge && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                  <ArrowUpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Your ATS score needs improvement</p>
                    <p className="text-xs text-amber-700 mt-1">Upgrade to Starter or Pro to generate a fully optimized, ATS-ready resume tailored to this job description.</p>
                    <button onClick={() => navigate('/#pricing')} className="mt-2 text-xs font-semibold text-amber-800 underline cursor-pointer">
                      View upgrade plans →
                    </button>
                  </div>
                </div>
              )}

              {/* Missing keywords */}
              {atsResult.missingKeywords?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">Missing Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsResult.missingKeywords.map((k) => (
                      <span key={k} className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full border border-red-100">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Present keywords */}
              {atsResult.presentKeywords?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">Keywords Found</p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsResult.presentKeywords.map((k) => (
                      <span key={k} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-100">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {atsResult.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Suggestions</p>
                  <ul className="space-y-2">
                    {atsResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-400 font-bold mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

          <Button variant="secondary" className="w-full" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" /> Check Another Resume
          </Button>
        </div>
      )}
    </div>
  )
}
