'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  BookOpen, 
  Calendar, 
  Phone, 
  Github, 
  Linkedin, 
  Instagram, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Terminal,
  FileBadge,
  Camera,
  Upload
} from 'lucide-react'
import { registerWithInvitationAction } from '@/app/actions/auth'
import { DbInvitation } from '@/lib/types/database'
import { ImageCropperModal } from './image-cropper-modal'

interface RegisterFormProps {
  invitation: DbInvitation
  token: string
}

export function RegisterForm({ invitation, token }: RegisterFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState(invitation.name || '')
  const [usn, setUsn] = useState('')
  const [year, setYear] = useState('3rd Year')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Avatar crop & upload state
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErrorMessage('Invalid format. Only JPEG, PNG, and WebP images are allowed.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (blob: Blob) => {
    setAvatarBlob(blob)
    setAvatarPreview(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('password', password)
      formData.append('full_name', fullName)
      formData.append('usn', usn)
      formData.append('branch', 'Cybersecurity')
      formData.append('year', year)
      formData.append('phone', phone)
      formData.append('bio', bio)
      formData.append('github_url', githubUrl)
      formData.append('linkedin_url', linkedinUrl)
      formData.append('instagram_url', instagramUrl)
      formData.append('portfolio_url', portfolioUrl)
      if (avatarBlob) {
        formData.append('avatar_file', avatarBlob, 'avatar.jpg')
      }

      const result = await registerWithInvitationAction(formData)

      if (result?.error) {
        setErrorMessage(result.error)
        setIsLoading(false)
        return
      }

      if (result?.success) {
        setIsSuccess(true)
        setIsLoading(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      if (
        typeof window !== 'undefined' &&
        (msg.includes('was not found on the server') ||
         msg.includes('Failed to find Server Action') ||
         msg.includes('failed-to-find-server-action'))
      ) {
        setErrorMessage('A newer version was deployed. Refreshing...')
        setTimeout(() => {
          window.location.reload()
        }, 300)
        return
      }
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="border border-[#00d05a]/30 bg-[#0a0a0a] p-8 rounded-xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#00d05a]/10 border border-[#00d05a]/40 mx-auto flex items-center justify-center text-[#00d05a] shadow-[0_0_20px_#00d05a]/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-mono font-bold uppercase text-foreground">
            ACCOUNT INITIALIZED
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            Your PROTON membership profile has been created and submitted. Your account status is currently{' '}
            <span className="text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">PENDING APPROVAL</span>.
            An administrator will review and verify your profile before publication in the public Teams directory.
          </p>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/member/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#00d05a]/20"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Invitation Info Box */}
      <div className="p-4 rounded-lg bg-[#111111] border border-[#222222] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">INVITED EMAIL:</span>
          <span className="text-[#00d05a] font-bold">{invitation.email}</span>
        </div>
        {invitation.designation && (
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">ASSIGNED POST:</span>
            <span className="text-foreground bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333]">
              {invitation.designation.name}
            </span>
          </div>
        )}
      </div>

      {/* Profile Photo / Avatar with Crop & Zoom */}
      <div className="p-4 rounded-xl bg-[#111111] border border-[#222222] flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full bg-[#181818] border-2 border-[#00d05a]/60 flex items-center justify-center overflow-hidden shadow-lg shadow-black">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono text-xl font-bold text-[#00d05a]">
                {fullName ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'PR'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
          >
            <Camera className="w-5 h-5 text-[#00d05a]" />
            <span className="text-[8px] font-mono uppercase mt-0.5">CHANGE</span>
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="text-xs font-mono font-bold uppercase text-foreground flex items-center justify-center sm:justify-start gap-2">
            <span>Profile Photo</span>
            {avatarBlob && (
              <span className="text-[10px] text-[#00d05a] bg-[#00d05a]/10 px-1.5 py-0.2 rounded border border-[#00d05a]/30">
                READY
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-muted-foreground">
            Upload and crop your picture with zoom controls. This will be published on the PROTON Teams page once approved.
          </p>

          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-foreground text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#00d05a]" />
            <span>{avatarBlob ? 'Re-crop Photo' : 'Upload & Crop Photo'}</span>
          </button>
        </div>
      </div>

      {/* Account Credentials */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a] flex items-center gap-2">
          <span>// 01. CREDENTIALS & SECURITY</span>
        </h3>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#00d05a]" />
            <span>Full Name *</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] focus:ring-1 focus:ring-[#00d05a] rounded px-3 py-2 text-sm font-mono text-foreground outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#00d05a]" />
              <span>Password (Min 8 Chars) *</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] focus:ring-1 focus:ring-[#00d05a] rounded px-3 py-2 text-sm font-mono text-foreground outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#00d05a]" />
              <span>Confirm Password *</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] focus:ring-1 focus:ring-[#00d05a] rounded px-3 py-2 text-sm font-mono text-foreground outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Academic & Club Identification (Private) */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a] flex items-center gap-2">
          <span>// 02. ACADEMIC DETAILS (CONFIDENTIAL)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
              USN (College ID) *
            </label>
            <input
              type="text"
              required
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              placeholder="4NM..."
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1 flex items-center justify-between">
              <span>Year of Study *</span>
              <span className="text-[10px] text-[#00d05a] font-mono">CYBERSECURITY</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none cursor-pointer"
            >
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
            Phone Number (Private)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 ..."
            className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
          />
        </div>
      </div>

      {/* Public Profile & Bio */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d05a] flex items-center gap-2">
          <span>// 03. PUBLIC TEAMS PROFILE</span>
        </h3>

        <div>
          <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
            Short Bio / Focus Area
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ethical Hacker / Penetration Tester / Web Dev enthusiast"
            className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
              GitHub URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
              Instagram URL
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
              Portfolio URL
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
            />
          </div>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-4 rounded-lg bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00d05a]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Terminal className="w-4 h-4 animate-spin text-black" />
            <span>SUBMITTING REGISTRATION...</span>
          </>
        ) : (
          <>
            <span>COMPLETE REGISTRATION</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Avatar Cropper Modal */}
      {cropSrc && (
        <ImageCropperModal
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropSrc(null)
            if (avatarInputRef.current) {
              avatarInputRef.current.value = ''
            }
          }}
        />
      )}
    </form>
  )
}
