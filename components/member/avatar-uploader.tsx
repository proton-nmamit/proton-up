'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Upload, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { uploadMemberAvatarAction, removeMemberAvatarAction } from '@/app/actions/profile'
import { ImageCropperModal } from './image-cropper-modal'
import { CyberConfirmDialog } from '@/components/ui/cyber-confirm-dialog'

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null
  memberInitials: string
  onAvatarUpdated?: (newUrl: string) => void
}

export function AvatarUploader({
  currentAvatarUrl,
  memberInitials,
  onAvatarUpdated,
}: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg('')
    setSuccessMsg('')

    // Client-side validations
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid format. Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5 MB before crop
    if (file.size > maxSize) {
      setErrorMsg('Original image exceeds 5 MB limit.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropSrc(null)
    setIsUploading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const croppedFile = new File([croppedBlob], `avatar_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })

      const formData = new FormData()
      formData.append('file', croppedFile)

      const result = await uploadMemberAvatarAction(formData)

      if (result.error) {
        setErrorMsg(result.error)
        setIsUploading(false)
        return
      }

      if (result.success && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl)
        setSuccessMsg('Profile photo calibrated and saved!')
        if (onAvatarUpdated) {
          onAvatarUpdated(result.avatarUrl)
        }
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrorMsg(msg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExecuteRemove = async () => {
    setIsRemoving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const result = await removeMemberAvatarAction()
      if (result.error) {
        setErrorMsg(result.error)
      } else if (result.success) {
        setAvatarUrl(null)
        setSuccessMsg('Profile photo removed successfully.')
        if (onAvatarUpdated) {
          onAvatarUpdated('')
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsConfirmOpen(false)
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove photo'
      setErrorMsg(msg)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#111111] border border-[#222222]">
      {/* Avatar Preview */}
      <div className="relative group shrink-0">
        <div className="w-24 h-24 rounded-full bg-[#181818] border-2 border-[#00d05a]/50 flex items-center justify-center overflow-hidden shadow-lg shadow-black">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile Avatar"
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="font-mono text-2xl font-bold text-[#00d05a]">
              {memberInitials || 'P'}
            </span>
          )}
        </div>

        {/* Overlay trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isRemoving}
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer disabled:cursor-not-allowed"
          title="Change profile photo"
        >
          <Camera className="w-6 h-6 text-[#00d05a]" />
          <span className="text-[9px] font-mono mt-1 uppercase">CHANGE</span>
        </button>
      </div>

      {/* Upload Details & Actions */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div>
          <div className="text-xs font-mono font-bold uppercase text-foreground">
            PROFILE PHOTO / AVATAR
          </div>
          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
            Supported formats: JPEG, PNG, WebP (Max 3 MB). This image will appear in the public Teams gallery once approved.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-foreground text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00d05a]" />
                <span>UPLOADING TO STORAGE...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-[#00d05a]" />
                <span>UPLOAD NEW PHOTO</span>
              </>
            )}
          </button>

          {avatarUrl && (
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isUploading || isRemoving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-400 hover:text-rose-300 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              title="Remove profile photo"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  <span>REMOVING...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>REMOVE PHOTO</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Interactive Crop & Zoom Modal */}
      {cropSrc && (
        <ImageCropperModal
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropSrc(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
        />
      )}

      {/* Cyber Confirmation Dialog */}
      <CyberConfirmDialog
        isOpen={isConfirmOpen}
        title="REMOVE PROFILE PHOTO"
        subtitle="AVATAR DELETION PROTOCOL"
        message={
          <span>
            Are you sure you want to remove your profile photo? This will permanently delete the uploaded photo from cloud storage and restore your default monogram avatar.
          </span>
        }
        confirmLabel="REMOVE PHOTO"
        cancelLabel="CANCEL"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleExecuteRemove}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
