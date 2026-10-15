'use client'

import React, { useState } from 'react'
import { 
  Layers, 
  Plus, 
  GripVertical,
  Edit3, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X, 
  Users, 
  Save,
  Check
} from 'lucide-react'
import { 
  DesignationWithCount, 
  createDesignationAction, 
  updateDesignationAction, 
  reorderAllDesignationsAction, 
  deleteDesignationAction 
} from '@/app/actions/designations'
import { CyberConfirmDialog } from '@/components/ui/cyber-confirm-dialog'

interface DesignationsManagerProps {
  initialDesignations: DesignationWithCount[]
}

export function DesignationsManager({ initialDesignations }: DesignationsManagerProps) {
  const [designations, setDesignations] = useState<DesignationWithCount[]>(initialDesignations)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingDesignation, setEditingDesignation] = useState<DesignationWithCount | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [orderSavedToast, setOrderSavedToast] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    id: string
    name: string
    memberCount: number
    isWarningOnly: boolean
    isLoading: boolean
  }>({
    isOpen: false,
    id: '',
    name: '',
    memberCount: 0,
    isWarningOnly: false,
    isLoading: false,
  })

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const reordered = [...designations]
    const [movedItem] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, movedItem)

    // Assign clean 1-based sequential display_order
    const updated = reordered.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }))

    setDesignations(updated)
    setDraggedIndex(null)
    setDragOverIndex(null)

    setIsSavingOrder(true)
    setErrorMessage('')
    try {
      const res = await reorderAllDesignationsAction(
        updated.map((d) => ({ id: d.id, display_order: d.display_order }))
      )
      if (res?.error) {
        setErrorMessage(res.error)
      } else {
        setOrderSavedToast(true)
        setTimeout(() => setOrderSavedToast(false), 2500)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save new order')
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const res = await createDesignationAction(formData)
    if (res.success) {
      window.location.reload()
    } else if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
    }
  }

  // Handle Edit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDesignation) return
    setIsLoading(true)
    setErrorMessage('')

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    formData.append('id', editingDesignation.id)

    const res = await updateDesignationAction(formData)
    if (res.success) {
      window.location.reload()
    } else if (res.error) {
      setErrorMessage(res.error)
      setIsLoading(false)
    }
  }

  // Handle Delete Click
  const handleDelete = (d: DesignationWithCount) => {
    if (d.member_count > 0) {
      setConfirmDialog({
        isOpen: true,
        id: d.id,
        name: d.name,
        memberCount: d.member_count,
        isWarningOnly: true,
        isLoading: false,
      })
      return
    }

    setConfirmDialog({
      isOpen: true,
      id: d.id,
      name: d.name,
      memberCount: 0,
      isWarningOnly: false,
      isLoading: false,
    })
  }

  // Execute Deletion
  const handleExecuteDelete = async () => {
    if (confirmDialog.isWarningOnly) {
      setConfirmDialog({ isOpen: false, id: '', name: '', memberCount: 0, isWarningOnly: false, isLoading: false })
      return
    }

    setConfirmDialog((prev) => ({ ...prev, isLoading: true }))
    try {
      const res = await deleteDesignationAction(confirmDialog.id)
      if (res.success) {
        setDesignations((prev) => prev.filter((item) => item.id !== confirmDialog.id))
        setConfirmDialog({ isOpen: false, id: '', name: '', memberCount: 0, isWarningOnly: false, isLoading: false })
      } else if (res.error) {
        setErrorMessage(res.error)
        setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Delete failed')
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <Layers className="w-4 h-4" />
            <span>ORGANIZATIONAL HIERARCHY // TEAMS TAXONOMY</span>
          </div>
          <h1 className="text-xl font-bold font-mono uppercase text-foreground">
            DESIGNATION & POST MANAGEMENT
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Manage designations, wings, core indicators, and the strict display hierarchy of the public Teams directory
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true)
            setErrorMessage('')
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Designation</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Designations Table */}
      <div className="border border-[#222] bg-[#0c0c0c] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#222] bg-[#0f0f0f] flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-foreground uppercase tracking-widest flex items-center gap-3">
            <span>ACTIVE DESIGNATIONS ROSTER ({designations.length})</span>
            {isSavingOrder && (
              <span className="text-[#00d05a] text-[10px] animate-pulse font-normal">// SAVING HIERARCHY...</span>
            )}
            {orderSavedToast && (
              <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" /> HIERARCHY SAVED
              </span>
            )}
          </span>
          <span className="text-muted-foreground text-[10px] uppercase flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5 text-[#00d05a]" />
            <span>DRAG &amp; DROP ROWS TO REORDER PUBLIC HIERARCHY</span>
          </span>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-[#1a1a1a]">
          {designations.map((d, index) => {
            const isDragging = draggedIndex === index
            const isOver = dragOverIndex === index && draggedIndex !== index

            return (
              <div
                key={d.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 space-y-3 transition-all cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? 'opacity-35 bg-[#161616] border border-dashed border-[#00d05a]/60'
                    : isOver
                    ? 'bg-[#00d05a]/10 border-t-2 border-t-[#00d05a]'
                    : 'hover:bg-[#111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0 select-none text-muted-foreground hover:text-[#00d05a]">
                    <GripVertical className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-muted-foreground font-bold text-xs font-mono">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
                      <span>{d.name}</span>
                      {d.is_core && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/30 text-[10px]">
                          <Shield className="w-3 h-3" />
                          <span>CORE</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono mt-0.5">
                      <span className="text-[#00d05a] font-bold">{d.category_label}</span>
                      <span className="text-muted-foreground ml-1">[{d.category}]</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161616] text-foreground border border-[#333] text-[10px]">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span>{d.member_count}</span>
                    </span>
                    {d.is_active ? (
                      <span className="text-emerald-400 font-bold text-[10px]">ACTIVE</span>
                    ) : (
                      <span className="text-zinc-500 font-bold text-[10px]">INACTIVE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingDesignation(d); setErrorMessage('') }} className="p-1.5 rounded bg-[#1c1c1c] hover:bg-[#252525] text-muted-foreground hover:text-foreground cursor-pointer" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d)} className="p-1.5 rounded bg-[#1c1c1c] hover:bg-rose-950/40 text-muted-foreground hover:text-rose-400 cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                <th className="py-3 px-4 w-28 text-center">Hierarchy</th>
                <th className="py-3 px-4">Designation Name</th>
                <th className="py-3 px-4">Category &amp; Wing</th>
                <th className="py-3 px-4 text-center">Core Post</th>
                <th className="py-3 px-4 text-center">Members</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {designations.map((d, index) => {
                const isDragging = draggedIndex === index
                const isOver = dragOverIndex === index && draggedIndex !== index

                return (
                  <tr
                    key={d.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all cursor-grab active:cursor-grabbing select-none ${
                      isDragging
                        ? 'opacity-35 bg-[#161616] border border-dashed border-[#00d05a]/60'
                        : isOver
                        ? 'bg-[#00d05a]/10 border-t-2 border-t-[#00d05a]'
                        : 'hover:bg-[#111]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-[#00d05a] group transition-colors">
                        <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-[#00d05a]" />
                        <span className="w-6 text-center text-muted-foreground/70 group-hover:text-foreground font-bold">
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{d.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[#00d05a] font-bold block">{d.category_label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">[{d.category}]</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.is_core ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00d05a]/10 text-[#00d05a] border border-[#00d05a]/30 text-[10px]">
                          <Shield className="w-3 h-3" />
                          <span>CORE</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161616] text-foreground border border-[#333] text-[10px]">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{d.member_count}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.is_active ? (
                        <span className="text-emerald-400 font-bold text-[10px]">ACTIVE</span>
                      ) : (
                        <span className="text-zinc-500 font-bold text-[10px]">INACTIVE</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => { setEditingDesignation(d); setErrorMessage('') }} className="p-1.5 rounded bg-[#1c1c1c] hover:bg-[#252525] text-muted-foreground hover:text-foreground cursor-pointer" title="Edit designation">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(d)} className="p-1.5 rounded bg-[#1c1c1c] hover:bg-rose-950/40 text-muted-foreground hover:text-rose-400 cursor-pointer" title="Delete designation">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414]">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                NEW DESIGNATION / POST
              </span>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block uppercase text-muted-foreground mb-1">Designation Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Lead Penetration Tester"
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category Slug *</label>
                  <input
                    type="text"
                    name="category"
                    required
                    placeholder="technical"
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Display Label *</label>
                  <input
                    type="text"
                    name="category_label"
                    required
                    placeholder="Technical Division"
                    className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] text-muted-foreground text-[11px] flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#00d05a] shrink-0" />
                <span>New designation will be added to the list. You can drag and drop it into any hierarchy position.</span>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_core" value="true" className="rounded bg-[#161616]" />
                  <span>Is Core Committee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_active" value="true" defaultChecked className="rounded bg-[#161616]" />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'CREATING...' : 'CREATE DESIGNATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDesignation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414]">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                EDIT DESIGNATION // {editingDesignation.name}
              </span>
              <button
                onClick={() => setEditingDesignation(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block uppercase text-muted-foreground mb-1">Designation Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingDesignation.name}
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category Slug *</label>
                  <input
                    type="text"
                    name="category"
                    required
                    defaultValue={editingDesignation.category}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Display Label *</label>
                  <input
                    type="text"
                    name="category_label"
                    required
                    defaultValue={editingDesignation.category_label}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_core"
                    value="true"
                    defaultChecked={editingDesignation.is_core}
                    className="rounded bg-[#161616]"
                  />
                  <span>Is Core Committee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={editingDesignation.is_active}
                    className="rounded bg-[#161616]"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setEditingDesignation(null)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Cyber Confirmation Dialog */}
      <CyberConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.isWarningOnly ? 'ACTIVE ASSIGNMENTS DETECTED' : 'DELETE DESIGNATION // HIERARCHY'}
        subtitle={confirmDialog.isWarningOnly ? 'RESTRICTED OPERATION' : 'PERMANENT REMOVAL PROTOCOL'}
        message={
          confirmDialog.isWarningOnly ? (
            <span>
              Cannot delete designation <strong className="text-amber-400 font-bold">&quot;{confirmDialog.name}&quot;</strong> because{' '}
              <strong className="text-white font-bold">{confirmDialog.memberCount} member(s)</strong> are currently assigned to it.
              Please reassign those members or mark the designation inactive instead.
            </span>
          ) : (
            <span>
              Are you sure you want to permanently delete designation <strong className="text-white font-bold">&quot;{confirmDialog.name}&quot;</strong>?
            </span>
          )
        }
        confirmLabel={confirmDialog.isWarningOnly ? 'UNDERSTOOD' : 'DELETE DESIGNATION'}
        cancelLabel={confirmDialog.isWarningOnly ? 'CLOSE' : 'CANCEL'}
        variant={confirmDialog.isWarningOnly ? 'warning' : 'danger'}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', name: '', memberCount: 0, isWarningOnly: false, isLoading: false })}
      />
    </div>
  )
}
