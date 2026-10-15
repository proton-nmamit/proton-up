'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Edit3, 
  AlertCircle, 
  Shield, 
  X, 
  Lock, 
  Mail, 
  Phone, 
  BookOpen, 
  Layers, 
  Save, 
  Check,
  Filter,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square
} from 'lucide-react'
import { DbDesignation, MemberStatus } from '@/lib/types/database'
import { 
  AdminMemberWithDetails, 
  approveMemberAction, 
  rejectMemberAction, 
  updateMemberByAdminAction,
  deleteMemberPermanentlyAction
} from '@/app/actions/members'
import { removeMemberAvatarAction } from '@/app/actions/profile'
import { AdminPermissions } from '@/lib/auth/admin-privileges'
import { CyberConfirmDialog } from '@/components/ui/cyber-confirm-dialog'

interface MembersManagerProps {
  initialMembers: AdminMemberWithDetails[]
  designations: DbDesignation[]
  adminPermissions?: AdminPermissions
}

export function MembersManager({ initialMembers, designations, adminPermissions }: MembersManagerProps) {
  const permissions = adminPermissions || {
    canApproveMembers: true,
    canRevokeMembers: true,
    canDeleteMembers: true,
    canEditMembers: true,
    isVicePresident: false,
    roleLabel: 'Administrator',
    email: '',
    roleType: 'super_admin' as const,
    isFullAdmin: true,
    isSuperAdmin: true,
    canManageEvents: true,
    canManageGallery: true,
    canManageDesignations: true,
    canManageInvitations: true,
    canViewAuditLogs: true,
  }

  const sanitizedInitialMembers = useMemo(() => {
    return (initialMembers || []).filter((m) => {
      const name = (m.full_name || '').toLowerCase().trim()
      const email = (m.email || '').toLowerCase().trim()
      return !(name === 'proton administrator' || email === 'admin@proton.cyber' || m.role === 'super_admin')
    })
  }, [initialMembers])

  const [members, setMembers] = useState<AdminMemberWithDetails[]>(sanitizedInitialMembers)
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all')
  const [designationFilter, setDesignationFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Reject Modal State
  const [rejectingMember, setRejectingMember] = useState<AdminMemberWithDetails | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [actionError, setActionError] = useState('')

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<AdminMemberWithDetails | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isRemovingAvatarConfirm, setIsRemovingAvatarConfirm] = useState(false)
  const [isRemovingAvatarLoading, setIsRemovingAvatarLoading] = useState(false)

  // Permanent Delete Modal State (Two-Step Confirmation)
  const [deletingMember, setDeletingMember] = useState<AdminMemberWithDetails | null>(null)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [deleteReason, setDeleteReason] = useState('')
  const [typedConfirmationName, setTypedConfirmationName] = useState('')
  const [confirmCheckbox1, setConfirmCheckbox1] = useState(false)
  const [confirmCheckbox2, setConfirmCheckbox2] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')

  // Pending count
  const pendingCount = useMemo(() => {
    return members.filter((m) => m.status === 'pending').length
  }, [members])

  // Filtered list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return members.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (designationFilter !== 'all' && m.designation_id !== designationFilter) return false

      if (!q) return true

      const nameMatch = m.full_name?.toLowerCase().includes(q)
      const emailMatch = m.email?.toLowerCase().includes(q)
      const usnMatch = m.usn?.toLowerCase().includes(q)
      const phoneMatch = m.phone?.toLowerCase().includes(q)
      const roleMatch = m.designations?.name?.toLowerCase().includes(q) || m.custom_role_text?.toLowerCase().includes(q)
      const deptMatch = m.department?.toLowerCase().includes(q)

      return nameMatch || emailMatch || usnMatch || phoneMatch || roleMatch || deptMatch
    })
  }, [members, statusFilter, designationFilter, searchQuery])

  // Quick Approve
  const handleApprove = async (id: string) => {
    setActionError('')
    const res = await approveMemberAction(id)
    if (res.success) {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'approved', rejection_reason: null } : m))
      )
    } else if (res.error) {
      setActionError(res.error)
    }
  }

  // Submit Rejection
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingMember) return
    setIsRejecting(true)
    setActionError('')

    const form = (e.target as HTMLElement)?.closest('form') || (e.target as HTMLFormElement)
    const textarea = form ? form.querySelector('textarea') : null
    const finalReason = textarea?.value?.trim() || rejectionReason.trim()

    const res = await rejectMemberAction(rejectingMember.id, finalReason)
    if (res.success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === rejectingMember.id
            ? { ...m, status: 'rejected', rejection_reason: finalReason }
            : m
        )
      )
      setIsRejecting(false)
      setRejectingMember(null)
      setRejectionReason('')
    } else if (res.error) {
      setActionError(res.error)
      setIsRejecting(false)
    }
  }

  // Submit Admin Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    setIsSavingEdit(true)
    setActionError('')

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    formData.append('id', editingMember.id)

    const res = await updateMemberByAdminAction(formData)
    if (res.success) {
      // Refresh local state
      const updatedDesignation = designations.find(
        (d) => d.id === (formData.get('designation_id') as string)
      )
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === editingMember.id) {
            return {
              ...m,
              full_name: formData.get('full_name') as string,
              branch: formData.get('branch') as string,
              year: formData.get('year') as string,
              joining_year: formData.get('joining_year') as string,
              designation_id: formData.get('designation_id') as string,
              designations: updatedDesignation || m.designations,
              department: m.department,
              usn: formData.get('usn') as string,
              phone: formData.get('phone') as string,
              bio: formData.get('bio') as string,
              status: formData.get('status') as MemberStatus,
            }
          }
          return m
        })
      )
      setIsSavingEdit(false)
      setEditingMember(null)
    } else if (res.error) {
      setActionError(res.error)
      setIsSavingEdit(false)
    }
  }

  // Remove Member Avatar
  const handleExecuteRemoveAvatar = async () => {
    if (!editingMember) return
    setIsRemovingAvatarLoading(true)
    try {
      const res = await removeMemberAvatarAction(editingMember.user_id || editingMember.id)
      if (res.success) {
        setEditingMember({ ...editingMember, avatar_url: null })
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, avatar_url: null } : m))
        )
        setIsRemovingAvatarConfirm(false)
      } else if (res.error) {
        setActionError(res.error)
        setIsRemovingAvatarConfirm(false)
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove photo')
      setIsRemovingAvatarConfirm(false)
    } finally {
      setIsRemovingAvatarLoading(false)
    }
  }

  // Submit Permanent Deletion with Two-Step Verification
  const handleExecutePermanentDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletingMember) return
    setIsDeleting(true)
    setDeleteError('')

    const res = await deleteMemberPermanentlyAction(
      deletingMember.id,
      deleteReason,
      typedConfirmationName
    )

    if (res.success) {
      const name = deletingMember.full_name
      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id))
      setDeleteSuccess(`Member "${name}" was permanently removed. Auth user destroyed and credentials revoked.`)
      setIsDeleting(false)
      setDeletingMember(null)
      setTimeout(() => setDeleteSuccess(''), 7000)
    } else {
      setDeleteError(res.error || 'Permanent deletion failed.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <Users className="w-4 h-4" />
            <span>MEMBER ROSTER // DIRECTORY ACCESS</span>
          </div>
          <h1 className="text-xl font-bold font-mono uppercase text-foreground">
            MEMBER MANAGEMENT & APPROVALS
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Review pending registrations, verify student credentials, and manage membership states
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded border border-[#222] bg-[#121212] text-[10px] font-mono text-muted-foreground">
              OPERATOR: <strong className={permissions.isVicePresident ? "text-amber-400" : "text-[#00d05a]"}>{permissions.roleLabel}</strong>
            </span>
            {permissions.isVicePresident && (
              <span className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[10px] font-mono font-bold">
                MEMBER APPROVAL PRIVILEGE ONLY
              </span>
            )}
          </div>

          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{pendingCount} PENDING REVIEW</span>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {deleteSuccess && (
        <div className="p-3.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00d05a]" />
            <span>{deleteSuccess}</span>
          </div>
          <button onClick={() => setDeleteSuccess('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-4">
        <div className="flex flex-col gap-3">
          {/* Status Tabs — wrap on mobile */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#00d05a] text-black font-bold'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-[#141414] text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black text-amber-300 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'approved'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-[#141414] text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Approved ({members.filter((m) => m.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'rejected'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-[#141414] text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Rejected ({members.filter((m) => m.status === 'rejected').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, USN, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] focus:border-[#00d05a] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-foreground outline-none"
            />
          </div>
        </div>

        {/* Designation Filter — full width on mobile */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a] text-xs font-mono min-w-0">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-[11px] uppercase shrink-0">Post:</span>
          <select
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            className="flex-1 min-w-0 bg-[#141414] border border-[#262626] focus:border-[#00d05a] rounded px-2.5 py-1 text-xs font-mono text-foreground outline-none"
          >
            <option value="all">-- All Designations ({designations.length}) --</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.category_label || d.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members List — Mobile Cards + Desktop Table */}

      {/* ── MOBILE: card-based list (below md) ── */}
      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground font-mono text-xs border border-[#222] rounded-xl bg-[#0c0c0c]">
            No members match the selected filters.
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isPending = member.status === 'pending'
            const isApproved = member.status === 'approved'
            const isRejected = member.status === 'rejected'

            return (
              <div
                key={member.id}
                className={`border rounded-xl bg-[#0c0c0c] p-4 space-y-3 font-mono text-xs ${
                  isPending ? 'border-amber-500/30 bg-amber-950/10' : 'border-[#222]'
                }`}
              >
                {/* Card header: avatar + name + role badge + status */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#181818] border border-[#333] flex items-center justify-center overflow-hidden shrink-0 text-foreground font-bold text-sm">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.full_name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        (member.full_name || 'P').charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{member.full_name}</span>
                        {(member.role === 'admin' || member.role === 'super_admin') && (
                          <span className="text-[9px] bg-red-950/60 text-red-400 border border-red-800/40 px-1 rounded uppercase shrink-0">
                            {member.role}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {member.branch || 'Branch N/A'}{member.year ? ` • ${member.year}` : ''}
                      </div>
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="shrink-0">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        PENDING
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        APPROVED
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" />
                        REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Confidential details */}
                <div className="space-y-1 pl-1">
                  {member.email && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Mail className="w-3 h-3 text-[#00d05a] shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>USN: {member.usn || 'N/A'}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Designation & Wing */}
                <div className="pl-1">
                  <div className="font-bold text-foreground">
                    {member.designations?.name || member.custom_role_text || 'General Member'}
                  </div>
                  <div className="text-[11px] text-[#00d05a]">
                    {member.designations?.category_label || member.department || 'Department N/A'}
                  </div>
                </div>

                {/* Rejection reason (if any) */}
                {isRejected && member.rejection_reason && (
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-300 font-mono italic break-words whitespace-pre-wrap leading-relaxed">
                    <span className="font-bold not-italic text-rose-400 block text-[9px] uppercase tracking-wider mb-0.5">
                      Rejection Reason:
                    </span>
                    &ldquo;{member.rejection_reason}&rdquo;
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a] flex-wrap">
                  {isPending && (
                    <>
                      {permissions.canApproveMembers && (
                        <button
                          onClick={() => handleApprove(member.id)}
                          className="px-3 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold text-[10px] uppercase transition-colors cursor-pointer"
                          title="Approve member"
                        >
                          Approve
                        </button>
                      )}
                      {permissions.canRevokeMembers && (
                        <button
                          onClick={() => { setRejectingMember(member); setRejectionReason('') }}
                          className="px-3 py-1.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40 text-[10px] uppercase transition-colors cursor-pointer"
                          title="Reject member"
                        >
                          Reject
                        </button>
                      )}
                    </>
                  )}

                  {isApproved && (
                    permissions.canRevokeMembers ? (
                      member.role === 'admin' && !permissions.isSuperAdmin ? (
                        <span className="text-[10px] font-mono text-zinc-600 italic" title="Only Super Administrator can revoke administrator accounts">
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => { setRejectingMember(member); setRejectionReason('') }}
                          className="px-3 py-1.5 rounded bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 text-[10px] uppercase transition-colors cursor-pointer"
                          title={member.role === 'admin' ? "Super Admin: Revoke / Deactivate Administrator Post" : "Revoke / Deactivate member from Teams"}
                        >
                          Revoke
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-600 italic" title="Revocation restricted to full administrators">
                        Active
                      </span>
                    )
                  )}

                  {isRejected && permissions.canApproveMembers && (
                    <button
                      onClick={() => handleApprove(member.id)}
                      className="px-3 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold text-[10px] uppercase transition-colors cursor-pointer shadow-sm shadow-[#00d05a]/20"
                      title="Reinstate and approve mistakenly rejected member"
                    >
                      Approve
                    </button>
                  )}

                  {permissions.canEditMembers && (
                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-1.5 rounded bg-[#1c1c1c] hover:bg-[#252525] text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Edit member details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">Edit</span>
                    </button>
                  )}

                  {permissions.canDeleteMembers &&
                  (member.role !== 'admin' || permissions.isSuperAdmin) &&
                  member.role !== 'super_admin' &&
                  member.full_name !== 'PROTON Administrator' ? (
                    <button
                      onClick={() => {
                        setDeletingMember(member)
                        setDeleteStep(1)
                        setDeleteReason('')
                        setTypedConfirmationName('')
                        setConfirmCheckbox1(false)
                        setConfirmCheckbox2(false)
                        setDeleteError('')
                      }}
                      className="p-1.5 rounded bg-[#1c1c1c] hover:bg-rose-950/60 text-muted-foreground hover:text-rose-400 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer flex items-center gap-1.5"
                      title={member.role === 'admin' ? "Super Admin: Permanently Expel & Delete Administrator" : "Permanently Expel & Delete Member"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">Delete</span>
                    </button>
                  ) : permissions.canDeleteMembers ? (
                    <span
                      className="p-1.5 text-neutral-700 cursor-not-allowed inline-flex items-center"
                      title="Protected administrator account (Only Super Admin can delete admins)"
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── DESKTOP: original table (md+) ── */}
      <div className="hidden md:block border border-[#222] bg-[#0c0c0c] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#141414] text-muted-foreground border-b border-[#222] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member Profile</th>
                <th className="py-3 px-4">Confidential Details</th>
                <th className="py-3 px-4">Designation & Wing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground font-mono">
                    No members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isPending = member.status === 'pending'
                  const isApproved = member.status === 'approved'
                  const isRejected = member.status === 'rejected'

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-[#111] transition-colors ${
                        isPending ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#181818] border border-[#333] flex items-center justify-center overflow-hidden shrink-0 text-foreground font-bold">
                            {member.avatar_url ? (
                              <Image
                                src={member.avatar_url}
                                alt={member.full_name}
                                width={36}
                                height={36}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              (member.full_name || 'P').charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{member.full_name}</span>
                              {member.role === 'admin' || member.role === 'super_admin' ? (
                                <span className="text-[9px] bg-red-950/60 text-red-400 border border-red-800/40 px-1 rounded uppercase">
                                  {member.role}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {member.branch || 'Branch N/A'}{' '}
                              {member.year ? `• ${member.year}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Confidential Details */}
                      <td className="py-3 px-4 space-y-0.5">
                        {member.email && (
                          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-[#00d05a]" />
                            <span>{member.email}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          <BookOpen className="w-3 h-3 text-amber-400" />
                          <span>USN: {member.usn || 'N/A'}</span>
                        </div>
                        {member.phone && (
                          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">
                          {member.designations?.name || member.custom_role_text || 'General Member'}
                        </div>
                        <div className="text-[11px] text-[#00d05a]">
                          {member.designations?.category_label || member.department || 'Department N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>PENDING</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>APPROVED</span>
                          </span>
                        )}
                        {isRejected && (
                          <div className="space-y-1 max-w-sm">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>REJECTED</span>
                            </span>
                            {member.rejection_reason && (
                              <div className="p-2 rounded bg-rose-950/25 border border-rose-900/30 text-[11px] text-rose-300 font-mono italic break-words whitespace-pre-wrap leading-relaxed">
                                &ldquo;{member.rejection_reason}&rdquo;
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && (
                            <>
                              {permissions.canApproveMembers && (
                                <button
                                  onClick={() => handleApprove(member.id)}
                                  className="px-2.5 py-1 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold text-[10px] uppercase transition-colors cursor-pointer"
                                  title="Approve member"
                                >
                                  Approve
                                </button>
                              )}
                              {permissions.canRevokeMembers && (
                                <button
                                  onClick={() => {
                                    setRejectingMember(member)
                                    setRejectionReason('')
                                  }}
                                  className="px-2.5 py-1 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40 text-[10px] uppercase transition-colors cursor-pointer"
                                  title="Reject member"
                                >
                                  Reject
                                </button>
                              )}
                            </>
                          )}

                          {isApproved && (
                            permissions.canRevokeMembers ? (
                              member.role === 'admin' && !permissions.isSuperAdmin ? (
                                <span
                                  className="text-[10px] font-mono text-zinc-600 px-1 italic"
                                  title="Only Super Administrator (admin@proton.cyber) can revoke administrator accounts"
                                >
                                  Protected
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRejectingMember(member)
                                    setRejectionReason('')
                                  }}
                                  className="px-2 py-1 rounded bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 text-[10px] uppercase transition-colors cursor-pointer"
                                  title={member.role === 'admin' ? "Super Admin: Revoke / Deactivate Administrator Post" : "Revoke / Deactivate member from Teams"}
                                >
                                  Revoke
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] font-mono text-zinc-600 px-1 italic" title="Revocation restricted to full administrators">
                                Active
                              </span>
                            )
                          )}

                          {isRejected && permissions.canApproveMembers && (
                            <button
                              onClick={() => handleApprove(member.id)}
                              className="px-2.5 py-1 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold text-[10px] uppercase transition-colors cursor-pointer shadow-sm shadow-[#00d05a]/20"
                              title="Reinstate and approve mistakenly rejected member"
                            >
                              Approve
                            </button>
                          )}

                          {permissions.canEditMembers && (
                            <button
                              onClick={() => setEditingMember(member)}
                              className="p-1.5 rounded bg-[#1c1c1c] hover:bg-[#252525] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Edit member details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Permanent Delete Action - Super Admin can delete admins; full admins can delete regular members */}
                          {permissions.canDeleteMembers &&
                          (member.role !== 'admin' || permissions.isSuperAdmin) &&
                          member.role !== 'super_admin' &&
                          member.full_name !== 'PROTON Administrator' ? (
                            <button
                              onClick={() => {
                                setDeletingMember(member)
                                setDeleteStep(1)
                                setDeleteReason('')
                                setTypedConfirmationName('')
                                setConfirmCheckbox1(false)
                                setConfirmCheckbox2(false)
                                setDeleteError('')
                              }}
                              className="p-1.5 rounded bg-[#1c1c1c] hover:bg-rose-950/60 text-muted-foreground hover:text-rose-400 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                              title={member.role === 'admin' ? "Super Admin: Permanently Expel & Delete Administrator" : "Permanently Expel & Delete Member"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : permissions.canDeleteMembers ? (
                            <span
                              className="p-1.5 text-neutral-700 cursor-not-allowed inline-flex items-center"
                              title="Protected administrator account (Only Super Admin can delete admins)"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414]">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
                <XCircle className="w-4 h-4" />
                <span>REJECT MEMBER PROFILE</span>
              </div>
              <button
                onClick={() => setRejectingMember(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 font-mono text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Rejecting <strong className="text-foreground">{rejectingMember.full_name}</strong> will remove them from the public Teams directory. The member will receive this feedback on their dashboard to correct their information.
              </p>

              <div>
                <label className="block uppercase text-muted-foreground mb-1.5">
                  Rejection Reason / Required Correction *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Please provide a clear profile photo and complete your department information."
                  className="w-full bg-[#161616] border border-[#333] focus:border-rose-500 rounded p-2.5 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setRejectingMember(null)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleConfirmReject as any}
                  disabled={isRejecting}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isRejecting ? 'REJECTING...' : 'CONFIRM REJECTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414] shrink-0">
              <div className="flex items-center gap-2 text-foreground font-mono text-xs font-bold uppercase">
                <Edit3 className="w-4 h-4 text-[#00d05a]" />
                <span>ADMIN EDIT // {editingMember.full_name}</span>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto font-mono text-xs flex-1">
              {editingMember.avatar_url && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#222]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#333] relative shrink-0">
                      <Image
                        src={editingMember.avatar_url}
                        alt={editingMember.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-foreground font-bold">Profile Photo Attached</div>
                      <div className="text-[10px] text-muted-foreground">Stored securely</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRemovingAvatarConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40 text-[10px] uppercase font-bold cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  defaultValue={editingMember.full_name}
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Designation</label>
                  <select
                    name="designation_id"
                    defaultValue={editingMember.designation_id || ''}
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
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
                  <label className="block uppercase text-muted-foreground mb-1">Status</label>
                  {((editingMember.role === 'admin' ||
                    editingMember.role === 'super_admin' ||
                    (editingMember.full_name && editingMember.full_name.toLowerCase().startsWith('proton ')) ||
                    (editingMember.email && editingMember.email.toLowerCase().includes('@proton'))) &&
                    !permissions.isSuperAdmin) ? (
                    <div className="w-full bg-[#141414] border border-[#262626] rounded p-2 text-xs font-mono flex items-center justify-between">
                      <span
                        className={
                          editingMember.status === 'approved'
                            ? 'text-emerald-400 font-bold'
                            : editingMember.status === 'pending'
                              ? 'text-amber-400 font-bold'
                              : 'text-rose-400 font-bold'
                        }
                      >
                        {editingMember.status.toUpperCase()}
                      </span>
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </div>
                  ) : (
                    <select
                      name="status"
                      defaultValue={editingMember.status}
                      className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Branch</label>
                  <input
                    type="hidden"
                    name="branch"
                    value="Cybersecurity"
                  />
                  <div className="w-full bg-[#161616] border border-[#333] rounded p-2 text-emerald-400 font-mono text-xs">
                    Cybersecurity
                  </div>
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Year</label>
                  <select
                    name="year"
                    defaultValue={editingMember.year || '3rd Year'}
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none cursor-pointer"
                  >
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Joining Year</label>
                  <input
                    type="text"
                    name="joining_year"
                    defaultValue={editingMember.joining_year || '2024'}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">USN (Private)</label>
                  <input
                    type="text"
                    name="usn"
                    defaultValue={editingMember.usn || ''}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Phone (Private)</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingMember.phone || ''}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Bio</label>
                <textarea
                  name="bio"
                  rows={2}
                  defaultValue={editingMember.bio || ''}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal (Two-Step Verification) */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-rose-900/60 rounded-2xl shadow-2xl shadow-rose-950/30 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-rose-900/40 bg-rose-950/30">
              <div className="flex items-center gap-2.5 text-rose-400 font-mono text-xs sm:text-sm font-bold tracking-wider uppercase">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>
                  {deleteStep === 1
                    ? 'SECURITY WARNING // STEP 1 OF 2'
                    : 'FINAL CONFIRMATION // STEP 2 OF 2'}
                </span>
              </div>
              <button
                onClick={() => {
                  setDeletingMember(null)
                  setDeleteError('')
                }}
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* STEP 1: Warning & Impact Explanation */}
            {deleteStep === 1 && (
              <div className="p-5 sm:p-6 space-y-5 font-mono">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    EXPEL & PERMANENTLY DELETE MEMBER
                  </h3>
                  <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                    This action is <strong className="text-rose-400 underline">PERMANENT AND IRREVERSIBLE</strong>.
                  </p>
                </div>

                {/* Target Member Summary */}
                <div className="p-4 rounded-xl bg-black/60 border border-neutral-800 space-y-2 text-xs">
                  <div className="text-muted-foreground uppercase text-[10px] tracking-widest">
                    // TARGET PROFILE:
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                      {deletingMember.avatar_url ? (
                        <Image
                          src={deletingMember.avatar_url}
                          alt={deletingMember.full_name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        (deletingMember.full_name || 'P').charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{deletingMember.full_name}</div>
                      <div className="text-neutral-400 text-[11px]">
                        {deletingMember.email || 'No email associated'} • USN: {deletingMember.usn || 'N/A'}
                      </div>
                      <div className="text-[#00d05a] text-[11px]">
                        {deletingMember.designations?.name || deletingMember.custom_role_text || 'Member'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Scope Alert */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-2 text-xs text-rose-300/90 leading-relaxed">
                  <div className="text-rose-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>WHAT HAPPENS UPON PERMANENT DELETION:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-neutral-300">
                    <li>
                      <strong className="text-white">Supabase Auth Destroyed:</strong> Their user account is permanently deleted. They will <span className="text-rose-400 font-bold">never</span> be able to log in to Admin or Member portals again.
                    </li>
                    <li>
                      <strong className="text-white">Profile Erased:</strong> Completely removed from the database and public Teams roster.
                    </li>
                    <li>
                      <strong className="text-white">Tokens Revoked:</strong> All pending or redeemed invitation links for their email are voided.
                    </li>
                    <li>
                      <strong className="text-white">Immutable Audit Log:</strong> A permanent, undeletable security log will record that you expelled this user.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setDeletingMember(null)}
                    className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('')
                      setDeleteStep(2)
                    }}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-rose-900/30"
                  >
                    <span>Proceed to Verification (2/2)</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Strict Confirmation & Reason Form */}
            {deleteStep === 2 && (
              <form onSubmit={handleExecutePermanentDelete} className="p-5 sm:p-6 space-y-4 font-mono">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    VERIFY DELETION INTENT
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    To prevent accidental removals, please complete all security verifications:
                  </p>
                </div>

                {/* Verification 1: Type Member Name */}
                <div>
                  <label className="block text-xs uppercase text-neutral-300 mb-1.5">
                    1. Type <span className="text-rose-400 font-bold font-mono select-all bg-black/60 px-1.5 py-0.5 rounded border border-rose-900/60">{deletingMember.full_name}</span> or <span className="text-rose-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-rose-900/60">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={typedConfirmationName}
                    onChange={(e) => setTypedConfirmationName(e.target.value)}
                    placeholder={deletingMember.full_name}
                    className="w-full bg-[#121212] border border-[#333] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg p-2.5 text-sm text-foreground outline-none transition-colors"
                  />
                </div>

                {/* Verification 2: Mandatory Reason */}
                <div>
                  <label className="block text-xs uppercase text-neutral-300 mb-1.5">
                    2. Reason for Expulsion (Mandatory for Audit Logs):
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Expelled due to disciplinary action / Account retired / Graduated..."
                    className="w-full bg-[#121212] border border-[#333] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-foreground outline-none transition-colors resize-none"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-1 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmCheckbox1}
                      onChange={(e) => setConfirmCheckbox1(e.target.checked)}
                      className="mt-0.5 rounded bg-[#161616] border-[#444] text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-neutral-300">
                      I confirm this user will be completely purged from Auth and barred from all portals.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmCheckbox2}
                      onChange={(e) => setConfirmCheckbox2(e.target.checked)}
                      className="mt-0.5 rounded bg-[#161616] border-[#444] text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-neutral-300">
                      I understand this action will be written to the immutable audit log with my admin signature.
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('')
                      setDeleteStep(1)
                    }}
                    className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    ← Back to Step 1
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isDeleting ||
                      !confirmCheckbox1 ||
                      !confirmCheckbox2 ||
                      deleteReason.trim().length < 3 ||
                      (typedConfirmationName.trim().toLowerCase() !== deletingMember.full_name.trim().toLowerCase() &&
                        typedConfirmationName.trim().toUpperCase() !== 'DELETE')
                    }
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/40 disabled:text-rose-600/50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-900/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'EXPELING MEMBER...' : 'PERMANENTLY DESTROY & DELETE'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Remove Avatar Confirmation Modal */}
      <CyberConfirmDialog
        isOpen={isRemovingAvatarConfirm}
        title="REMOVE PROFILE PHOTO"
        description={
          editingMember
            ? `Are you sure you want to remove the profile photo for ${editingMember.full_name}? The image file will be permanently purged from secure storage.`
            : ''
        }
        confirmText="Remove Photo"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRemovingAvatarLoading}
        onConfirm={handleExecuteRemoveAvatar}
        onCancel={() => setIsRemovingAvatarConfirm(false)}
      />
    </div>
  )
}
