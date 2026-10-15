'use client'

import React, { useState } from 'react'
import { 
  Mail, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink,
  Shield,
  Send
} from 'lucide-react'
import { DbInvitation, DbDesignation } from '@/lib/types/database'
import { CyberConfirmDialog } from '@/components/ui/cyber-confirm-dialog'
import { 
  createInvitationAction, 
  revokeInvitationAction,
  getOrCreateInvitationLinkAction 
} from '@/app/actions/invitations'

interface InvitationsManagerProps {
  initialInvitations: DbInvitation[]
  designations: DbDesignation[]
}

export function InvitationsManager({ initialInvitations, designations }: InvitationsManagerProps) {
  const [invitations, setInvitations] = useState<DbInvitation[]>(initialInvitations)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedInvId, setCopiedInvId] = useState<string | null>(null)
  const [loadingInvId, setLoadingInvId] = useState<string | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    id: string
    name: string
    email: string
    isLoading: boolean
  }>({
    isOpen: false,
    id: '',
    name: '',
    email: '',
    isLoading: false,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setGeneratedLink('')

    try {
      const form = (e.target as HTMLElement)?.closest('form') || (e.target as HTMLFormElement)
      const formData = form ? new FormData(form) : new FormData()
      const finalName = (formData.get('name') as string)?.trim() || name.trim()
      const finalEmail = (formData.get('email') as string)?.trim() || email.trim()
      const finalDesId = (formData.get('designation_id') as string)?.trim() || designationId

      const payload = new FormData()
      payload.append('name', finalName)
      payload.append('email', finalEmail)
      if (finalDesId) payload.append('designation_id', finalDesId)

      const res = await createInvitationAction(payload)

      if (res?.error) {
        setErrorMsg(res.error)
        setIsLoading(false)
        return
      }

      if (res?.success && res.inviteUrl) {
        const fullUrl = `${window.location.origin}${res.inviteUrl}`
        setGeneratedLink(fullUrl)
        if (res.invitation) {
          setInvitations([res.invitation as unknown as DbInvitation, ...invitations])
        }
        setIsLoading(false)
        setIsModalOpen(false) // Close modal so banner is directly visible
        setName('')
        setEmail('')
        setDesignationId('')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invitation'
      setErrorMsg(msg)
      setIsLoading(false)
    }
  }

  const handleCopyLinkForInvitation = async (inv: DbInvitation) => {
    setLoadingInvId(inv.id)
    try {
      const res = await getOrCreateInvitationLinkAction(inv.id)
      if (res.success && res.inviteUrl) {
        const fullUrl = `${window.location.origin}${res.inviteUrl}`
        await navigator.clipboard.writeText(fullUrl)
        setCopiedInvId(inv.id)
        setTimeout(() => setCopiedInvId(null), 2500)
      } else {
        setErrorMsg(res.error || 'Could not retrieve link.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to copy link'
      setErrorMsg(msg)
    } finally {
      setLoadingInvId(null)
    }
  }

  const handleRevoke = (id: string, name: string, email: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      name,
      email,
      isLoading: false,
    })
  }

  const handleExecuteRevoke = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }))
    try {
      const res = await revokeInvitationAction(confirmDialog.id)
      if (res?.success) {
        setInvitations(
          invitations.map((inv) =>
            inv.id === confirmDialog.id ? { ...inv, revoked_at: new Date().toISOString() } : inv
          )
        )
        setConfirmDialog({ isOpen: false, id: '', name: '', email: '', isLoading: false })
      } else if (res?.error) {
        setErrorMsg('Error revoking invitation: ' + res.error)
        setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error revoking invitation')
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-foreground flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-[#00d05a]" />
            <span>MEMBER INVITATION DISPATCHER</span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Generate single-use, cryptographic invitation links to register new club members
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true)
            setGeneratedLink('')
            setErrorMsg('')
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#00d05a]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Invitation</span>
        </button>
      </div>

      {/* Generated Link Alert Banner if available */}
      {generatedLink && (
        <div className="p-5 rounded-lg border border-[#00d05a]/40 bg-[#00d05a]/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00d05a] uppercase">
            <CheckCircle2 className="w-4 h-4 text-[#00d05a]" />
            <span>INVITATION GENERATED SUCCESSFULLY</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            Copy and send this unique registration link directly to the member. This link expires in 7 days and can only be used once.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedLink}
              className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-xs font-mono text-[#00d05a] outline-none select-all"
            />
            <button
              onClick={() => copyToClipboard(generatedLink)}
              className="w-full sm:w-auto px-4 py-2 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'COPIED!' : 'COPY'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Invitations Table / List */}
      <div className="border border-[#222] bg-[#0c0c0c] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#222] bg-[#0f0f0f] flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">
            ALL DISPATCHED INVITATIONS ({invitations.length})
          </span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            // ZERO-TRUST PROTOCOL
          </span>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-mono uppercase text-foreground font-bold">No Invitations Dispatched Yet</h3>
            <p className="text-xs font-mono text-muted-foreground mt-1 max-w-sm mx-auto">
              Click &quot;New Invitation&quot; above to issue a cryptographic registration link to a new member.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[#1a1a1a]">
              {invitations.map((inv) => {
                const isAccepted = !!inv.accepted_at
                const isRevoked = !!inv.revoked_at
                const isExpired = new Date(inv.expires_at) < new Date()
                const isPending = !isAccepted && !isRevoked && !isExpired
                return (
                  <div key={inv.id} className="p-4 space-y-3 hover:bg-[#111] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-foreground truncate">{inv.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">{inv.email}</div>
                      </div>
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">ACCEPTED</span>
                      )}
                      {isRevoked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-500/30 text-[10px] font-bold shrink-0">REVOKED</span>
                      )}
                      {isExpired && !isAccepted && !isRevoked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 text-[10px] font-bold shrink-0">EXPIRED</span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-bold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          PENDING
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1a1a1a]">
                      <div className="space-y-0.5 text-[11px] font-mono">
                        {inv.designation ? (
                          <span className="inline-block bg-[#161616] text-[#00d05a] border border-[#00d05a]/30 px-2 py-0.5 rounded text-[10px]">
                            {inv.designation.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">No designation</span>
                        )}
                        <div className="text-muted-foreground text-[10px] mt-1">
                          Expires: {new Date(inv.expires_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleCopyLinkForInvitation(inv)}
                              disabled={loadingInvId === inv.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00d05a]/10 hover:bg-[#00d05a]/25 text-[#00d05a] border border-[#00d05a]/40 transition-colors text-[10px] font-mono font-bold cursor-pointer"
                              title="Copy unique registration link"
                            >
                              {copiedInvId === inv.id ? (
                                <>
                                  <Check className="w-3 h-3 text-[#00d05a]" />
                                  <span>COPIED!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>{loadingInvId === inv.id ? 'GENERATING...' : 'COPY LINK'}</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleRevoke(inv.id, inv.name, inv.email)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 border border-rose-800/40 transition-colors text-[10px] font-mono cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141414] text-muted-foreground border-b border-[#222] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created / Expires</th>
                    <th className="py-3 px-4 text-right">Actions &amp; Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {invitations.map((inv) => {
                    const isAccepted = !!inv.accepted_at
                    const isRevoked = !!inv.revoked_at
                    const isExpired = new Date(inv.expires_at) < new Date()
                    const isPending = !isAccepted && !isRevoked && !isExpired
                    return (
                      <tr key={inv.id} className="hover:bg-[#111] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">{inv.name}</div>
                          <div className="text-[11px] text-muted-foreground">{inv.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          {inv.designation ? (
                            <span className="inline-block bg-[#161616] text-[#00d05a] border border-[#00d05a]/30 px-2 py-0.5 rounded text-[10px]">
                              {inv.designation.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ACCEPTED</span>
                            </span>
                          )}
                          {isRevoked && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                              <X className="w-3 h-3" />
                              <span>REVOKED</span>
                            </span>
                          )}
                          {isExpired && !isAccepted && !isRevoked && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
                              <span>EXPIRED</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>PENDING</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          <div>Created: {new Date(inv.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                          <div>Expires: {new Date(inv.expires_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleCopyLinkForInvitation(inv)}
                                  disabled={loadingInvId === inv.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00d05a]/10 hover:bg-[#00d05a]/25 text-[#00d05a] border border-[#00d05a]/40 transition-colors text-[10px] font-mono font-bold cursor-pointer shadow-[0_0_10px_rgba(0,208,90,0.1)]"
                                  title="Copy unique registration link for this member"
                                >
                                  {copiedInvId === inv.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-[#00d05a]" />
                                      <span>COPIED!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>{loadingInvId === inv.id ? 'GENERATING...' : 'COPY LINK'}</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleRevoke(inv.id, inv.name, inv.email)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 border border-rose-800/40 transition-colors text-[10px] cursor-pointer"
                                  title="Revoke this invitation"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Revoke</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>


      {/* Create Invitation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#111]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00d05a]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  ISSUE NEW INVITATION LINK
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                  Member Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                  Member Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                  Pre-Assigned Designation / Post (Optional)
                </label>
                <select
                  name="designation_id"
                  value={designationId}
                  onChange={(e) => setDesignationId(e.target.value)}
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded px-3 py-2 text-xs font-mono text-foreground outline-none"
                >
                  <option value="">-- Assign Later by Admin --</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category_label || d.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-[#1a1a1a] hover:bg-[#252525] text-muted-foreground font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreate as any}
                  disabled={isLoading}
                  className="px-5 py-2 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'GENERATING...' : 'DISPATCH LINK'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Cyber Confirmation Dialog */}
      <CyberConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="REVOKE INVITATION // ZERO-TRUST"
        subtitle="SECURITY INVALIDATION PROTOCOL"
        message={
          <span>
            Are you sure you want to revoke the invitation for <strong className="text-white font-bold">&quot;{confirmDialog.name}&quot;</strong> ({confirmDialog.email})? The registration token will be permanently deactivated.
          </span>
        }
        confirmLabel="REVOKE TOKEN"
        cancelLabel="CANCEL"
        variant="danger"
        isLoading={confirmDialog.isLoading}
        onConfirm={handleExecuteRevoke}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', name: '', email: '', isLoading: false })}
      />
    </div>
  )
}
