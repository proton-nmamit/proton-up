'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FolderPlus,
  Folder,
  Layers,
  Filter
} from 'lucide-react'
import { DbGalleryImage, DbGalleryAlbum, ContentStatus } from '@/lib/types/database'
import { CyberConfirmDialog } from '@/components/ui/cyber-confirm-dialog'
import { 
  uploadGalleryImageAction, 
  updateGalleryImageAction, 
  deleteGalleryImageAction,
  createGalleryAlbumAction,
  deleteGalleryAlbumAction,
  toggleGalleryImageStatusAction
} from '@/app/actions/gallery'

interface GalleryManagerProps {
  initialImages: DbGalleryImage[]
  initialAlbums: DbGalleryAlbum[]
}

const GALLERY_CATEGORIES = [
  'Workshops',
  'Competitions',
  'Cultural',
  'Outreach',
  'Seminars',
  'Team Moments',
]

export function GalleryManager({ initialImages, initialAlbums }: GalleryManagerProps) {
  const [images, setImages] = useState<DbGalleryImage[]>(initialImages)
  const [albums, setAlbums] = useState<DbGalleryAlbum[]>(initialAlbums)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [albumFilter, setAlbumFilter] = useState('all')

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<DbGalleryImage | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadRatio, setUploadRatio] = useState<'16:9' | '9:16'>('16:9')
  const [editRatio, setEditRatio] = useState<'16:9' | '9:16'>('16:9')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'image' | 'album'
    id: string
    title: string
    isLoading: boolean
  }>({
    isOpen: false,
    type: 'image',
    id: '',
    title: '',
    isLoading: false,
  })

  // Map each album to its photo count
  const albumPhotoCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const img of images) {
      if (img.album_id) {
        map.set(img.album_id, (map.get(img.album_id) || 0) + 1)
      }
    }
    return map
  }, [images])

  const filteredImages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return images.filter((img) => {
      if (statusFilter !== 'all' && (img.status || 'published') !== statusFilter) return false
      if (categoryFilter !== 'all' && img.category !== categoryFilter) return false
      if (albumFilter !== 'all' && img.album_id !== albumFilter) return false
      if (!q) return true
      return (
        img.title.toLowerCase().includes(q) ||
        img.event_name.toLowerCase().includes(q) ||
        (img.caption && img.caption.toLowerCase().includes(q))
      )
    })
  }, [images, searchQuery, categoryFilter, albumFilter, statusFilter])

  const handleToggleStatus = async (id: string, currentStatus: ContentStatus) => {
    const newStatus: ContentStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      const res = await toggleGalleryImageStatusAction(id, newStatus)
      if (res.success) {
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, status: newStatus } : img))
        )
        setSuccessMsg(
          newStatus === 'published'
            ? 'Photo approved and published live to public gallery!'
            : 'Photo reverted to draft (hidden from public).'
        )
        setTimeout(() => setSuccessMsg(''), 4000)
      } else if (res.error) {
        setErrorMsg(res.error)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update photo status')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const file = formData.get('image_file') as File | null
      if (!file || file.size === 0) {
        setErrorMsg('Please select an image file to upload.')
        setIsSubmitting(false)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`Selected image is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed limit is 10 MB.`)
        setIsSubmitting(false)
        return
      }

      const res = await uploadGalleryImageAction(formData)
      if (res.success) {
        window.location.reload()
      } else if (res.error) {
        setErrorMsg(res.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.'
      if (msg.toLowerCase().includes('unexpected response')) {
        setErrorMsg('The server could not process the photo upload. Please ensure your image is under 10 MB and in JPEG/PNG/WebP format.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingImage) return
    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      formData.append('id', editingImage.id)

      const res = await updateGalleryImageAction(formData)
      if (res.success) {
        window.location.reload()
      } else if (res.error) {
        setErrorMsg(res.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed.'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'image',
      id,
      title,
      isLoading: false,
    })
  }

  const handleDeleteAlbum = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'album',
      id,
      title,
      isLoading: false,
    })
  }

  const handleExecuteDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }))
    try {
      if (confirmDialog.type === 'image') {
        const res = await deleteGalleryImageAction(confirmDialog.id)
        if (res.success) {
          setImages((prev) => prev.filter((img) => img.id !== confirmDialog.id))
          setSuccessMsg(`Photo "${confirmDialog.title}" deleted permanently.`)
          setTimeout(() => setSuccessMsg(''), 4000)
          setConfirmDialog({ isOpen: false, type: 'image', id: '', title: '', isLoading: false })
        } else if (res.error) {
          setErrorMsg(res.error)
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
        }
      } else if (confirmDialog.type === 'album') {
        const res = await deleteGalleryAlbumAction(confirmDialog.id)
        if (res.success) {
          setAlbums((prev) => prev.filter((a) => a.id !== confirmDialog.id))
          setImages((prev) => prev.map((img) => img.album_id === confirmDialog.id ? { ...img, album_id: null } : img))
          if (albumFilter === confirmDialog.id) setAlbumFilter('all')
          setSuccessMsg(`Album "${confirmDialog.title}" deleted successfully.`)
          setTimeout(() => setSuccessMsg(''), 4000)
          setConfirmDialog({ isOpen: false, type: 'album', id: '', title: '', isLoading: false })
        } else if (res.error) {
          setErrorMsg(res.error)
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Deletion failed.')
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)

      const res = await createGalleryAlbumAction(formData)
      if (res.success && res.album) {
        setAlbums((prev) => [...prev, res.album!])
        setIsAlbumModalOpen(false)
        setSuccessMsg(`Album "${res.album.title}" created successfully!`)
        setTimeout(() => setSuccessMsg(''), 4000)
      } else if (res.error) {
        setErrorMsg(res.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Album creation failed.'
      if (msg.toLowerCase().includes('unexpected response')) {
        setErrorMsg('The server was unable to create the album. Please check database connectivity.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00d05a] mb-1">
            <ImageIcon className="w-4 h-4" />
            <span>VISUAL ARCHIVE // PHOTO &amp; ALBUM CURATION</span>
          </div>
          <h1 className="text-xl font-bold font-mono uppercase text-foreground">
            GALLERY MANAGEMENT CONSOLE
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Upload high-resolution event moments, organize albums, manage captions, and curate the public gallery
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => {
              setIsAlbumModalOpen(true)
              setErrorMsg('')
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded bg-[#161616] hover:bg-[#222] border border-[#333] text-foreground font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer w-full sm:w-auto"
          >
            <FolderPlus className="w-4 h-4 text-[#00d05a]" />
            <span>New Album</span>
          </button>

          <button
            data-testid="upload-photo-btn"
            onClick={() => {
              setIsUploadOpen(true)
              setErrorMsg('')
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer w-full sm:w-auto shadow-[0_0_15px_rgba(0,208,90,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Global Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Notification */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Curated Albums Section */}
      <div className="border border-[#222] bg-[#0c0c0c] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#222] bg-[#0f0f0f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#00d05a]" />
            <span className="font-bold text-foreground uppercase tracking-widest">
              CURATED ALBUMS ({albums.length})
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
            <span>// BIND PHOTOS INTO EVENT PACKS</span>
            {albumFilter !== 'all' && (
              <button
                onClick={() => setAlbumFilter('all')}
                className="text-[#00d05a] hover:underline cursor-pointer font-bold"
              >
                [ Clear Album Filter ]
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {albums.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-muted-foreground">
              <FolderPlus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p>No albums created yet.</p>
              <button
                onClick={() => setIsAlbumModalOpen(true)}
                className="mt-3 text-xs text-[#00d05a] hover:underline uppercase font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {albums.map((alb) => {
                const count = albumPhotoCounts.get(alb.id) || 0
                const isSelected = albumFilter === alb.id
                return (
                  <div
                    key={alb.id}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#141414] border-[#00d05a] shadow-[0_0_10px_rgba(0,208,90,0.15)]'
                        : 'bg-[#111111] border-[#222] hover:border-[#333]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#00d05a]' : 'text-muted-foreground'}`} />
                          <h4 className="font-bold font-mono text-xs text-foreground truncate" title={alb.title}>
                            {alb.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1c1c] text-[#00d05a] border border-[#333] shrink-0">
                          {count} {count === 1 ? 'photo' : 'photos'}
                        </span>
                      </div>

                      {alb.description && (
                        <p className="text-[11px] font-mono text-muted-foreground line-clamp-2 mb-3">
                          {alb.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1c1c1c] mt-2">
                      <button
                        onClick={() => setAlbumFilter(isSelected ? 'all' : alb.id)}
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#00d05a] text-black'
                            : 'bg-[#181818] text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isSelected ? 'Viewing Photos' : 'Filter Photos'}
                      </button>

                      <button
                        onClick={() => handleDeleteAlbum(alb.id, alb.title)}
                        className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete album"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-[#222] bg-[#0c0c0c] space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#1c1c1c]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'draft', 'published', 'archived'] as const).map((st) => {
              const count = st === 'all' ? images.length : images.filter((i) => (i.status || 'published') === st).length
              const label = st === 'all' ? 'All' : st === 'draft' ? 'Pending Approval' : st === 'published' ? 'Published' : 'Archived'
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer shrink-0 ${
                    statusFilter === st
                      ? 'bg-[#00d05a] text-black font-bold'
                      : 'bg-[#141414] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase hidden sm:inline">
            // LIVE APPROVAL QUEUE
          </span>
        </div>

        {/* Category & Album Filters + Search */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors cursor-pointer shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-[#222] text-[#00d05a] font-bold border border-[#00d05a]/40'
                  : 'bg-[#141414] text-muted-foreground hover:text-foreground'
              }`}
            >
              All Categories
            </button>
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-[#222] text-[#00d05a] font-bold border border-[#00d05a]/40'
                    : 'bg-[#141414] text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {albums.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={albumFilter}
                  onChange={(e) => setAlbumFilter(e.target.value)}
                  className="bg-[#141414] border border-[#262626] focus:border-[#00d05a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All Albums</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({albumPhotoCounts.get(a.id) || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search title, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#262626] focus:border-[#00d05a] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-foreground outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Photos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredImages.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground font-mono text-xs border border-[#222] rounded-xl bg-[#0c0c0c]">
            No gallery images match the selected filter. Click &quot;Upload Photo&quot; to add new moments.
          </div>
        ) : (
          filteredImages.map((img) => {
            const albumObj = albums.find((a) => a.id === img.album_id)
            const isDraft = img.status === 'draft'
            const isPublished = img.status === 'published'
            return (
              <div
                key={img.id}
                className="border border-[#222] rounded-xl bg-[#0c0c0c] overflow-hidden flex flex-col justify-between hover:border-[#333] transition-all shadow-lg group"
              >
                <div>
                  {/* Image View */}
                  <div className="relative aspect-[16/9] w-full bg-[#141414] overflow-hidden">
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || img.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded bg-black/80 text-[#00d05a] border border-[#00d05a]/30 text-[10px] font-mono font-bold uppercase">
                        {img.category}
                      </span>
                      {albumObj && (
                        <span className="px-2 py-0.5 rounded bg-black/80 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono font-bold uppercase truncate max-w-[130px]">
                          📁 {albumObj.title}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isPublished
                            ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                            : isDraft
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {isDraft ? '⏳ PENDING' : isPublished ? '✓ LIVE' : 'ARCHIVED'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/80 text-foreground border border-[#333] text-[10px] font-mono">
                        #{img.display_order}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3.5 space-y-1.5 font-mono">
                    <h3 className="font-bold text-xs text-foreground line-clamp-1">
                      {img.title}
                    </h3>
                    <div className="text-[11px] text-[#00d05a] truncate">
                      {img.event_name} • {img.date_str}
                    </div>
                    {img.caption && (
                      <p className="text-[11px] text-muted-foreground italic line-clamp-2 pt-0.5">
                        &ldquo;{img.caption}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 border-t border-[#1a1a1a] flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => handleToggleStatus(img.id, img.status)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-all ${
                      isPublished
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        : 'bg-[#00d05a] text-black hover:bg-[#00d05a]/90 shadow-[0_0_12px_rgba(0,208,90,0.25)]'
                    }`}
                  >
                    {isPublished ? '✕ Revert to Draft' : '✓ Approve & Publish'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingImage(img)
                        setErrorMsg('')
                      }}
                      className="p-1.5 rounded bg-[#1c1c1c] hover:bg-[#262626] text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit image details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(img.id, img.title)}
                      className="p-1.5 rounded bg-[#1c1c1c] hover:bg-rose-950/40 text-muted-foreground hover:text-rose-400 cursor-pointer"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Upload Image Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414] shrink-0">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                UPLOAD GALLERY PHOTO
              </span>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4 overflow-y-auto font-mono text-xs flex-1">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Pending Review by Default:</span> Newly uploaded moments are saved as <strong>Draft</strong> and will not appear on the live site until explicitly approved by an administrator.
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1.5">
                  Aspect Ratio Option *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadRatio('16:9')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      uploadRatio === '16:9'
                        ? 'bg-[#00d05a]/15 text-[#00d05a] border-[#00d05a] shadow-[0_0_12px_rgba(0,208,90,0.2)]'
                        : 'bg-[#141414] text-muted-foreground border-[#333] hover:text-foreground hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <span className="w-5 h-3 rounded-xs border-2 border-current shrink-0" />
                    <span>16:9 Landscape (Widescreen)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadRatio('9:16')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      uploadRatio === '9:16'
                        ? 'bg-[#00d05a]/15 text-[#00d05a] border-[#00d05a] shadow-[0_0_12px_rgba(0,208,90,0.2)]'
                        : 'bg-[#141414] text-muted-foreground border-[#333] hover:text-foreground hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <span className="w-3 h-5 rounded-xs border-2 border-current shrink-0" />
                    <span>9:16 Portrait (Vertical)</span>
                  </button>
                </div>

                <label className="block uppercase text-muted-foreground mb-1">
                  Select Photo File * (Max 10 MB, JPEG/PNG/WebP) &bull; <span className="text-[#00d05a] font-bold">{uploadRatio === '16:9' ? '16:9 (1920×1080)' : '9:16 (1080×1920)'}</span>
                </label>
                <input
                  type="file"
                  name="image_file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setUploadPreview(URL.createObjectURL(f))
                    else setUploadPreview(null)
                  }}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground text-xs file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#00d05a] file:text-black file:font-bold file:cursor-pointer"
                />
                {uploadPreview && (
                  <div className="mt-3 p-3 rounded-xl border border-[#262626] bg-[#101010] flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a] animate-pulse" />
                        {uploadRatio === '16:9' ? '16:9 Landscape Live Preview' : '9:16 Portrait Live Preview'}
                      </span>
                      <span className="text-[10px] text-[#00d05a] font-bold font-mono">
                        {uploadRatio === '16:9' ? '16:9 WIDESCREEN' : '9:16 VERTICAL'}
                      </span>
                    </div>
                    <div className={`relative rounded-lg overflow-hidden border border-[#00d05a]/50 shadow-xl bg-black ${
                      uploadRatio === '16:9' ? 'w-full max-w-sm aspect-[16/9]' : 'w-44 aspect-[9/16]'
                    }`}>
                      <Image
                        src={uploadPreview}
                        alt="Gallery Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Photo Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Inauguration Keynote"
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Event Name *</label>
                  <input
                    type="text"
                    name="event_name"
                    required
                    placeholder="e.g. CyberX 2025"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Date / Year</label>
                  <input
                    type="text"
                    name="date_str"
                    placeholder="e.g. Feb 2025"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category</label>
                  <select
                    name="category"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Album (Optional)</label>
                  <select
                    name="album_id"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  >
                    <option value="">-- No Album --</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Display Rank</label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={50}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Publication Status</label>
                  <select
                    name="status"
                    defaultValue="draft"
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none font-bold text-[#00d05a]"
                  >
                    <option value="draft">Draft (Pending Admin Review)</option>
                    <option value="published">Published (Live Publicly)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Caption</label>
                <textarea
                  rows={2}
                  name="caption"
                  placeholder="Memorable moment description..."
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none resize-none"
                />
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Alt Text (Accessibility)</label>
                <input
                  type="text"
                  name="alt_text"
                  placeholder="Descriptive image text..."
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'UPLOADING...' : 'UPLOAD TO GALLERY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414] shrink-0">
              <span className="font-mono text-xs font-bold uppercase text-foreground">
                EDIT GALLERY PHOTO
              </span>
              <button
                onClick={() => setEditingImage(null)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto font-mono text-xs flex-1">
              <div className="flex flex-col items-center p-3 rounded-xl border border-[#222] bg-[#101010]">
                <div className="flex items-center justify-between w-full mb-2.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d05a]" />
                    Photo Preview
                  </span>
                  <div className="inline-flex rounded-lg border border-[#333] p-0.5 bg-[#141414]">
                    <button
                      type="button"
                      onClick={() => setEditRatio('16:9')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        editRatio === '16:9' ? 'bg-[#00d05a] text-black' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      16:9 Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRatio('9:16')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        editRatio === '9:16' ? 'bg-[#00d05a] text-black' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      9:16 Portrait
                    </button>
                  </div>
                </div>
                <div className={`relative rounded-lg overflow-hidden border border-[#333] shadow-md bg-black transition-all ${
                  editRatio === '16:9' ? 'w-full max-w-sm aspect-[16/9]' : 'w-40 aspect-[9/16]'
                }`}>
                  <Image
                    src={editingImage.image_url}
                    alt={editingImage.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Photo Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingImage.title}
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Event Name *</label>
                  <input
                    type="text"
                    name="event_name"
                    required
                    defaultValue={editingImage.event_name}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Date / Year</label>
                  <input
                    type="text"
                    name="date_str"
                    defaultValue={editingImage.date_str}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingImage.category}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Album</label>
                  <select
                    name="album_id"
                    defaultValue={editingImage.album_id || ''}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  >
                    <option value="">-- No Album --</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Display Rank</label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingImage.display_order}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase text-muted-foreground mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingImage.status}
                    className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Caption</label>
                <textarea
                  rows={2}
                  name="caption"
                  defaultValue={editingImage.caption || ''}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none resize-none"
                />
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Alt Text</label>
                <input
                  type="text"
                  name="alt_text"
                  defaultValue={editingImage.alt_text || ''}
                  className="w-full bg-[#161616] border border-[#333] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {isAlbumModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e0e] border border-[#222] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#141414]">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#00d05a]" />
                <span className="font-mono text-xs font-bold uppercase text-foreground">
                  CREATE NEW ALBUM
                </span>
              </div>
              <button
                onClick={() => setIsAlbumModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="p-6 space-y-4 font-mono text-xs">
              {errorMsg && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Album Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Hackathon 2025"
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none"
                />
              </div>

              <div>
                <label className="block uppercase text-muted-foreground mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  name="description"
                  placeholder="Album highlights, event themes, or key moments..."
                  className="w-full bg-[#161616] border border-[#333] focus:border-[#00d05a] rounded p-2 text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsAlbumModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#1a1a1a] text-muted-foreground uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#00d05a] hover:bg-[#00d05a]/90 text-black font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'CREATING...' : 'CREATE ALBUM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Cyber Confirmation Dialog */}
      <CyberConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'image' ? 'DELETE PHOTO // GALLERY ARCHIVE' : 'DELETE ALBUM // GALLERY ARCHIVE'}
        subtitle={confirmDialog.type === 'image' ? 'PERMANENT DELETION PROTOCOL' : 'UNBIND ALBUM PROTOCOL'}
        message={
          confirmDialog.type === 'image' ? (
            <span>
              Are you sure you want to permanently delete photo <strong className="text-white font-bold">&quot;{confirmDialog.title}&quot;</strong>? This action cannot be undone.
            </span>
          ) : (
            <span>
              Are you sure you want to delete album <strong className="text-cyan-400 font-bold">&quot;{confirmDialog.title}&quot;</strong>? Photos inside this album will remain in the gallery but become unassigned.
            </span>
          )
        }
        confirmLabel={confirmDialog.type === 'image' ? 'DELETE PHOTO' : 'DELETE ALBUM'}
        cancelLabel="CANCEL"
        variant="danger"
        isLoading={confirmDialog.isLoading}
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, type: 'image', id: '', title: '', isLoading: false })}
      />
    </div>
  )
}
