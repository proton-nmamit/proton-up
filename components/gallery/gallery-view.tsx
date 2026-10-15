'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2 
} from 'lucide-react'
import { GalleryItem } from '@/lib/proton-data'

const ease = [0.22, 1, 0.36, 1] as const

interface GalleryViewProps {
  initialItems: GalleryItem[]
}

export function GalleryView({ initialItems }: GalleryViewProps) {
  const [items] = useState<GalleryItem[]>(initialItems)
  const [selectedCat, setSelectedCat] = useState('All')
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = useMemo(() => {
    const defaultCats = ['All', 'Workshops', 'Competitions', 'Cultural', 'Outreach', 'Seminars']
    const seen = new Set(defaultCats)
    for (const item of items) {
      if (item.category && !seen.has(item.category)) {
        defaultCats.push(item.category)
        seen.add(item.category)
      }
    }
    return defaultCats
  }, [items])

  const filteredItems = useMemo(() => {
    if (selectedCat.toLowerCase() === 'all') return items
    return items.filter((item) => item.category?.toLowerCase() === selectedCat.toLowerCase())
  }, [items, selectedCat])

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activePhotoIdx !== null) {
      setActivePhotoIdx((activePhotoIdx - 1 + filteredItems.length) % filteredItems.length)
    }
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activePhotoIdx !== null) {
      setActivePhotoIdx((activePhotoIdx + 1) % filteredItems.length)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
      {/* Header Hero */}
      <div className="text-center space-y-4 max-w-3xl pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-card/60 text-[11px] font-mono text-[#00d05a] uppercase tracking-widest shadow-[0_0_10px_rgba(0,208,90,0.15)]"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>MEDIA VAULT // {items.length} MOMENTS ARCHIVED</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="font-pixel text-4xl sm:text-6xl lg:text-7xl text-foreground tracking-tight select-none uppercase"
        >
          PROTON GALLERY
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="text-xs sm:text-sm md:text-base text-muted-foreground font-mono leading-relaxed"
        >
          Visual chronicle of workshops, hackathons, outreach campaigns, and student milestones across NMAMIT.
        </motion.p>
      </div>

      {/* Category Filters */}
      <div className="flex items-center justify-center gap-2 flex-wrap w-full">
        {categories.map((cat) => {
          const isActive = selectedCat.toLowerCase() === cat.toLowerCase()
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-1.5 rounded-md text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#00d05a] text-black font-bold shadow-sm'
                  : 'bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {filteredItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease }}
            onClick={() => setActivePhotoIdx(idx)}
            className="group relative aspect-[16/9] sm:aspect-[4/3] w-full rounded-2xl border border-border/70 bg-card/60 overflow-hidden cursor-pointer hover:border-[#00d05a]/70 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#00d05a]/5"
          >
            <Image
              src={item.imageUrl || '/images/hero-1.png'}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

            {/* Badges on top */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-[#00d05a] border border-white/10">
                {item.category}
              </span>
              <span className="p-1.5 rounded-full bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 inset-x-0 p-4 font-mono space-y-1">
              <span className="text-[10px] text-muted-foreground block text-[#00d05a]">
                {item.eventName} &bull; {item.date}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">
                {item.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal Rendered in Portal at Root */}
      {mounted && createPortal(
        <AnimatePresence>
          {activePhotoIdx !== null && filteredItems[activePhotoIdx] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl"
              onClick={() => setActivePhotoIdx(null)}
            >
              <div className="relative max-w-5xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                  onClick={() => setActivePhotoIdx(null)}
                  className="absolute -top-10 sm:-top-12 right-0 p-2 text-white hover:text-[#00d05a] transition-colors cursor-pointer z-30"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Left Arrow */}
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white transition-colors z-20 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white transition-colors z-20 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Active Image (Supports both 16:9 Landscape and 9:16 Portrait seamlessly) */}
                <div className="relative w-full max-w-4xl h-[60vh] sm:h-[75vh] max-h-[75vh] rounded-2xl overflow-hidden border border-border/80 bg-black flex items-center justify-center shadow-2xl">
                  <Image
                    src={filteredItems[activePhotoIdx].imageUrl || '/images/hero-1.png'}
                    alt={filteredItems[activePhotoIdx].title}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Caption Bar */}
                <div className="w-full mt-4 p-4 rounded-xl bg-card/90 border border-border/80 font-mono text-center space-y-1">
                  <div className="text-xs font-bold text-[#00d05a]">
                    {filteredItems[activePhotoIdx].eventName} &bull; {filteredItems[activePhotoIdx].date}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-foreground">
                    {filteredItems[activePhotoIdx].title}
                  </h4>
                  {filteredItems[activePhotoIdx].description && (
                    <p className="text-xs text-muted-foreground max-w-xl mx-auto">
                      {filteredItems[activePhotoIdx].description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
