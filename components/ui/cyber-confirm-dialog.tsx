'use client'

import React from 'react'
import { AlertTriangle, Trash2, AlertCircle, Info, CheckCircle2, X } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  subtitle?: string
  message?: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  confirmText?: string
  cancelLabel?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function CyberConfirmDialog({
  isOpen,
  title,
  subtitle,
  message,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const resolvedMessage = message ?? description
  const resolvedConfirmLabel = confirmLabel ?? confirmText ?? 'CONFIRM'
  const resolvedCancelLabel = cancelLabel ?? cancelText ?? 'CANCEL'

  const isDanger = variant === 'danger'
  const isWarning = variant === 'warning'
  const isSuccess = variant === 'success'

  const Icon = isDanger ? Trash2 : isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Info

  const glowBorder = isDanger
    ? 'border-rose-900/60 shadow-[0_0_30px_rgba(225,29,72,0.2)]'
    : isWarning
    ? 'border-amber-900/60 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
    : isSuccess
    ? 'border-emerald-900/60 shadow-[0_0_30px_rgba(0,208,90,0.2)]'
    : 'border-cyan-900/60 shadow-[0_0_30px_rgba(6,182,212,0.2)]'

  const iconBg = isDanger
    ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
    : isWarning
    ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
    : isSuccess
    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
    : 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'

  const confirmBtnBg = isDanger
    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
    : isWarning
    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
    : isSuccess
    ? 'bg-[#00d05a] hover:bg-[#00d05a]/90 text-black shadow-[0_0_15px_rgba(0,208,90,0.4)]'
    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel()
      }}
    >
      <div className={`w-full max-w-md bg-[#0a0a0a] border rounded-xl overflow-hidden ${glowBorder} flex flex-col font-mono animate-in zoom-in-95 duration-200`}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c1c1c] bg-[#101010]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDanger ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-400 animate-pulse' : 'bg-[#00d05a] animate-pulse'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              {title}
            </span>
          </div>
          {!isLoading && (
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              {subtitle && (
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  // {subtitle}
                </div>
              )}
              <div className="text-xs text-foreground/90 leading-relaxed">
                {resolvedMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-[#0d0d0d] border-t border-[#1a1a1a] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${confirmBtnBg}`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <span>{resolvedConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
