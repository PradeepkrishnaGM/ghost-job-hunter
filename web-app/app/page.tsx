'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // New Filter States
  const [levelFilter, setLevelFilter] = useState('All')

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .order('published_date', { ascending: false })
      
      if (data) setJobs(data)
      setIsLoading(false)
    }
    fetchJobs()
  }, [])

  // Advanced Filtering Logic
  const filteredJobs = jobs.filter((job) => {
    // 1. Search Bar Match
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 2. Experience Level Match (Looks for keywords in the title)
    let matchesLevel = true
    if (levelFilter !== 'All') {
      matchesLevel = job.title.toLowerCase().includes(levelFilter.toLowerCase())
    }

    return matchesSearch && matchesLevel
  })

  // Helper function to get the source website name from the URL
  const getSourceFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch (e) {
      return 'Unknown Source'
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* THIS IS YOUR NEW LOGO */}
            <img src="/logo.png" alt="Ghost Job Hunter Logo" className="w-8 h-8 rounded-md object-cover" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Ghost <span className="text-indigo-500 font-light">(Job)</span> Hunter
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-400">
            <span>{jobs.length} Jobs Indexed</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Feed
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Stop Applying to Ghosts.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-8">
            Filter through live tech jobs and instantly spot stale listings that have been idle for months.
          </p>

          {/* Search & Filter Controls */}
          <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by role, company, or tech..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Experience Level Dropdown */}
            <select 
              className="bg-[#131B2C] border border-white/10 rounded-xl py-3 px-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px] cursor-pointer"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="All">All Levels</option>
              <option value="Senior">Senior / Staff</option>
              <option value="Mid">Mid-Level</option>
              <option value="Junior">Junior</option>
              <option value="Intern">Internship</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className={`group relative p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                  job.is_ghost_job 
                    ? 'bg-rose-950/10 border-rose-900/30 hover:border-rose-500/30' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-semibold text-slate-400">{job.company}</p>
                    {job.is_ghost_job ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>Ghost
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>Active
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-lg font-bold text-slate-100 mb-4 leading-tight group-hover:text-indigo-400 transition-colors">
                    <a href={job.link} target="_blank" rel="noopener noreferrer">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      {job.title}
                    </a>
                  </h2>
                </div>

                <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                      🌍 {getSourceFromUrl(job.link)}
                    </span>
                    <span className="flex items-center gap-1">
                      🗓 {job.days_active} days ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredJobs.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            No jobs found matching your filters.
          </div>
        )}
      </main>
    </div>
  )
}
