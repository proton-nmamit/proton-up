'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Lock, 
  BookOpen, 
  Phone, 
  Github, 
  Linkedin, 
  Instagram, 
  Globe, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Save, 
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'
import { DbProfile, DbDesignation } from '@/lib/types/database'
import { updateMemberProfileAction, changePasswordAction } from '@/app/actions/profile'
import { AvatarUploader } from './avatar-uploader'
import { PublicProfilePreview } from './public-profile-preview'

interface ProfileEditorProps {
  initialProfile: DbProfile
  email: string
  designations: DbDesignation[]
}

export function ProfileEditor({ initialProfile, email, designations }: ProfileEditorProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<DbProfile>(initialProfile)

  // Form states
  const [fullName, setFullName] = useState(initialProfile.full_name || '')
  const branch = 'Cybersecurity'
  const [year, setYear] = useState(initialProfile.year || '3rd Year')
  const [joiningYear, setJoiningYear] = useState(initialProfile.joining_year || '2024')
  const [designationId, setDesignationId] = useState(initialProfile.designation_id || '')
  const [department, setDepartment] = useState(initialProfile.department || '')
  const [bio, setBio] = useState(initialProfile.bio || '')
  const [usn, setUsn] = useState(initialProfile.usn || '')
  const [phone, setPhone] = useState(initialProfile.phone || '')
  const [githubUrl, setGithubUrl] = useState(initialProfile.github_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedin_url || '')
  const [instagramUrl, setInstagramUrl] = useState(initialProfile.instagram_url || '')
  const [portfolioUrl, setPortfolioUrl] = useState(initialProfile.portfolio_url || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Password change states
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [isChangingPw, setIsChangingPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const status = profile.status
  const isRejected = status === 'rejected'
  const isPending = status === 'pending'
  const isApproved = status === 'approved'

  const selectedDesignation = designations.find((d) => d.id === designationId)
  const displayDesignationName = selectedDesignation?.name || profile.designations?.name || 'General Member'

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PR'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    setPwError('')
    setPwSuccess('')

    try {
      let passwordChanged = false

      // If any password fields are filled, validate and update the password
      if (newPw || confirmPw || currentPw) {
        if (!newPw || newPw.length < 8) {
          const err = 'New password must be at least 8 characters long.'
          setErrorMessage(err)
          setPwError(err)
          setIsSaving(false)
          return
        }
        if (newPw !== confirmPw) {
          const err = 'New password and confirmation do not match.'
          setErrorMessage(err)
          setPwError(err)
          setIsSaving(false)
          return
        }

        const pwFormData = new FormData()
        pwFormData.append('current_password', currentPw)
        pwFormData.append('new_password', newPw)
        pwFormData.append('confirm_password', confirmPw)

        const pwRes = await changePasswordAction(pwFormData)
        if (pwRes.error) {
          setErrorMessage(pwRes.error)
          setPwError(pwRes.error)
          setIsSaving(false)
          return
        }

        passwordChanged = true
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      }

      const formData = new FormData()
      formData.append('full_name', fullName)
      formData.append('branch', branch)
      formData.append('year', year)
      formData.append('joining_year', joiningYear)
      formData.append('designation_id', designationId)
      formData.append('department', department)
      formData.append('bio', bio)
      formData.append('usn', usn)
      formData.append('phone', phone)
      formData.append('github_url', githubUrl)
      formData.append('linkedin_url', linkedinUrl)
      formData.append('instagram_url', instagramUrl)
      formData.append('portfolio_url', portfolioUrl)

      const res = await updateMemberProfileAction(formData)

      if (res.error) {
        setErrorMessage(res.error)
        setIsSaving(false)
        return
      }

      if (res.success) {
        const successText = passwordChanged
          ? 'Profile details and password updated successfully! Your new credentials are now active.'
          : res.statusTransitionedToPending
          ? 'Profile updated and resubmitted for admin review! Status set to PENDING.'
          : 'Profile saved successfully!'

        setSuccessMessage(successText)
        if (passwordChanged) {
          setPwSuccess('Password updated successfully! Your new password is now active.')
        }

        if (res.statusTransitionedToPending) {
          setProfile({ ...profile, status: 'pending', rejection_reason: null })
        }

        router.refresh()
        setIsSaving(false)
        setTimeout(() => {
          setSuccessMessage('')
          setPwSuccess('')
        }, 6000)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(msg)
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    setErrorMessage('')

    if (!newPw || newPw.length < 8) {
      setPwError('New password must be at least 8 characters long.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.')
      return
    }

    setIsChangingPw(true)
    try {
      const formData = new FormData()
      formData.append('current_password', currentPw)
      formData.append('new_password', newPw)
      formData.append('confirm_password', confirmPw)

      const res = await changePasswordAction(formData)
      if (res.error) {
        setPwError(res.error)
        setErrorMessage(res.error)
      } else {
        const msg = res.message || 'Password updated successfully! Your new password is now active.'
        setPwSuccess(msg)
        setSuccessMessage(msg)
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
        setTimeout(() => {
          setPwSuccess('')
          setSuccessMessage('')
        }, 6000)
      }
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsChangingPw(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Status Notice Card */}
      {isPending && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-3 shadow-lg shadow-black">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider flex items-center gap-2">
              <span>PROFILE STATUS: PENDING REVIEW</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <p className="text-amber-300/80 leading-relaxed">
              Your member profile has been registered and is currently under review by PROTON administrators. Once approved, your profile and designation will be displayed publicly on the Teams page.
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-start gap-3 shadow-lg shadow-black">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider flex items-center gap-2">
              <span>PROFILE STATUS: APPROVED & ACTIVE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-emerald-300/80 leading-relaxed">
              Your profile is verified and active in the official PROTON directory. Any updates to your profile details will reflect across the site.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-mono space-y-3 shadow-lg shadow-black">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-rose-400">
                PROFILE STATUS: REJECTED // ACTION REQUIRED
              </div>
              <p className="text-rose-300/90 leading-relaxed">
                Your profile was reviewed and rejected by an administrator with the following feedback:
              </p>
            </div>
          </div>

          {profile.rejection_reason && (
            <div className="p-3.5 rounded bg-black/60 border border-rose-900/50 text-rose-200 text-xs font-mono italic">
              &ldquo;{profile.rejection_reason}&rdquo;
            </div>
          )}

          <div className="text-[11px] text-rose-300/70 pt-1">
            💡 <span className="font-bold">Next Step:</span> Correct your information using the form below and click &quot;SAVE & RESUBMIT PROFILE&quot;. Resubmitting will change your status back to <strong>PENDING REVIEW</strong>.
          </div>
        </div>
      )}

      {/* Avatar Uploader Section */}
      <AvatarUploader
        currentAvatarUrl={avatarUrl}
        memberInitials={initials}
        onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
      />

      {/* Form Feedback Banners */}
      {errorMessage && (
        <div className="p-3.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Editor on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form (2 columns on desktop) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
          {/* Section 1: Public Profile Details */}
          <div className="p-6 rounded-xl border border-[#222222] bg-[#0c0c0c] space-y-5">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a] flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>01. PUBLIC PROFILE INFORMATION</span>
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                VISIBLE ON TEAMS PAGE
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sujal Poojary"
                className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] focus:ring-1 focus:ring-[#00d05a] rounded-lg px-3.5 py-2 text-xs font-mono text-foreground outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00d05a]" />
                  <span>Designation / Post</span>
                </label>
                <select
                  value={designationId}
                  onChange={(e) => setDesignationId(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none"
                >
                  <option value="">-- General Member --</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category_label || d.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. CSE (Cybersecurity)"
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded-lg px-3.5 py-2 text-xs font-mono text-foreground outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                  Branch
                </label>
                <div className="w-full bg-[#111] border border-[#222] rounded px-3 py-1.5 text-xs font-mono text-emerald-400 flex items-center justify-between">
                  <span>Cybersecurity</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-sans">Locked</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                  Year of Study
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none cursor-pointer"
                >
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                  Joining Year
                </label>
                <input
                  type="text"
                  value={joiningYear}
                  onChange={(e) => setJoiningYear(e.target.value)}
                  placeholder="2024"
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono uppercase text-muted-foreground">
                  Short Bio / Specialization
                </label>
                <span className={`text-[10px] font-mono ${bio.length > 450 ? 'text-amber-400' : 'text-muted-foreground/60'}`}>
                  {bio.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your cybersecurity passions, CTF focus, or dev projects..."
                className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded-lg px-3.5 py-2 text-xs font-mono text-foreground outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Social & Portfolio Links */}
          <div className="p-6 rounded-xl border border-[#222222] bg-[#0c0c0c] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a] flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>02. SOCIAL & REPOSITORY LINKS</span>
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                PUBLIC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>GitHub Profile</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>LinkedIn Profile</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Instagram Profile</span>
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Portfolio Website</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Confidential & Internal Data (Private) */}
          <div className="p-6 rounded-xl border border-rose-900/30 bg-[#0e0a0a] space-y-4">
            <div className="flex items-center justify-between border-b border-rose-950/80 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>03. CONFIDENTIAL CLUB IDENTIFIERS</span>
              </h2>
              <span className="text-[10px] font-mono text-rose-400/80 uppercase bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/40">
                🔒 ADMIN ONLY // STRICTLY PRIVATE
              </span>
            </div>

            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              These details are encrypted and accessible exclusively to PROTON core administrators for official college communications. They will NEVER be displayed on the public website.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  <span>College USN</span>
                </label>
                <input
                  type="text"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  placeholder="4NM..."
                  className="w-full bg-[#141010] border border-rose-900/40 focus:border-rose-500 rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full bg-[#141010] border border-rose-900/40 focus:border-rose-500 rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: System Locked Identifiers (Read-Only) */}
          <div className="p-5 rounded-xl border border-[#1e1e1e] bg-[#080808] space-y-3">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>SYSTEM CONTROLLED FIELDS (READ-ONLY)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#111] border border-[#222]">
                <span className="text-muted-foreground text-[10px] block">INVITED EMAIL</span>
                <span className="text-foreground font-bold truncate block">{email}</span>
              </div>
              <div className="p-2.5 rounded bg-[#111] border border-[#222]">
                <span className="text-muted-foreground text-[10px] block">ACCESS ROLE</span>
                <span className="text-foreground font-bold uppercase block">{profile.role}</span>
              </div>
              <div className="p-2.5 rounded bg-[#111] border border-[#222]">
                <span className="text-muted-foreground text-[10px] block">APPROVAL STATUS</span>
                <span className={`font-bold uppercase block ${
                  isApproved ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Security & Password Management */}
          <div className="p-6 rounded-xl border border-[#222222] bg-[#0c0c0c] space-y-5">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#00d05a]" />
                <span>05. SECURITY & CREDENTIALS // CHANGE PASSWORD</span>
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                ACCESS CONTROL
              </span>
            </div>

            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              Update your account password. Must contain at least 8 characters. You can click &quot;UPDATE PASSWORD NOW&quot; below to apply it immediately, or click &quot;SAVE PROFILE CHANGES&quot; at the bottom to save your profile details and password simultaneously.
            </p>

            {pwError && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5 flex items-center justify-between">
                  <span>Current Password (Optional verification)</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded-lg px-3.5 py-2 pr-10 text-xs font-mono text-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                    New Password * (Min 8 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Enter new password..."
                      className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded-lg px-3.5 py-2 pr-10 text-xs font-mono text-foreground outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newPw && confirmPw) {
                          handlePasswordSubmit(e)
                        }
                      }
                    }}
                    placeholder="Re-type new password..."
                    className="w-full bg-[#111] border border-[#222] focus:border-[#00d05a] rounded-lg px-3.5 py-2 text-xs font-mono text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={isChangingPw || !newPw || !confirmPw}
                  className="py-2.5 px-5 rounded-lg bg-[#112418] hover:bg-[#183523] border border-[#00d05a]/50 hover:border-[#00d05a] text-[#00d05a] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#00d05a]/10"
                >
                  {isChangingPw ? (
                    <>
                      <Terminal className="w-3.5 h-3.5 animate-spin text-[#00d05a]" />
                      <span>UPDATING PASSWORD...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 text-[#00d05a]" />
                      <span>UPDATE PASSWORD NOW</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Or click &ldquo;SAVE PROFILE CHANGES&rdquo; below to save all updates together.
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              data-testid="save-profile-btn"
              onClick={handleSubmit as any}
              disabled={isSaving}
              className="w-full py-3.5 px-6 rounded-lg bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00d05a]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Terminal className="w-4 h-4 animate-spin text-black" />
                  <span>SAVING CHANGES...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {isRejected ? 'SAVE & RESUBMIT PROFILE FOR REVIEW' : 'SAVE PROFILE UPDATES'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Public Profile Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <PublicProfilePreview
              fullName={fullName}
              designationName={displayDesignationName}
              department={department}
              avatarUrl={avatarUrl}
              bio={bio}
              branch={branch}
              year={year}
              githubUrl={githubUrl}
              linkedinUrl={linkedinUrl}
              instagramUrl={instagramUrl}
              portfolioUrl={portfolioUrl}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
