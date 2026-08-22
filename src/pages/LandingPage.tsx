import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../App.css'

gsap.registerPlugin(ScrollTrigger)

const workflowSteps = [
  { label: 'Profile', detail: 'One source of truth' },
  { label: 'Attendance', detail: 'Every day, visible' },
  { label: 'Leave', detail: 'Clear requests' },
  { label: 'Approval', detail: 'Decisions in context' },
  { label: 'Payroll', detail: 'Salary, in view' },
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="arrow-icon">
      <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="check-icon">
      <path d="m3.25 8.1 3.1 3.05 6.4-6.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon ${open ? 'is-open' : ''}`} aria-hidden="true">
      <i />
      <i />
    </span>
  )
}

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  href?: string
  className?: string
}

function Button({ children, variant = 'primary', href = '/auth/signin', className = '' }: ButtonProps) {
  const cls = `button button-${variant} ${className}`
  const inner = (
    <>
      <span>{children}</span>
      {variant === 'primary' && <ArrowIcon />}
    </>
  )
  if (href.startsWith('/')) {
    return (
      <Link className={cls} to={href}>
        {inner}
      </Link>
    )
  }
  return (
    <a className={cls} href={href}>
      {inner}
    </a>
  )
}

function StatusChip({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'pending' | 'neutral' }) {
  return <span className={`status-chip status-${tone}`}>{children}</span>
}

function MiniAvatar({ initials, tone = 'orange' }: { initials: string; tone?: 'orange' | 'violet' | 'yellow' }) {
  return <span className={`mini-avatar avatar-${tone}`}>{initials}</span>
}

function DashboardPanel({ variant = 'hero' }: { variant?: 'hero' | 'attendance' | 'leave' | 'admin' }) {
  const compact = variant !== 'hero'

  return (
    <div className={`dashboard-panel ${compact ? `panel-${variant}` : 'panel-hero'}`}>
      <div className="panel-topbar">
        <div className="panel-brand"><span className="panel-brand-mark">D</span><span>dayflow</span></div>
        {!compact && <span className="panel-date">Tuesday, 18 June 2024</span>}
        <span className="panel-user"><MiniAvatar initials="AK" tone="violet" /></span>
      </div>

      {variant === 'hero' && (
        <>
          <div className="panel-heading-row"><div><p className="panel-kicker">Good morning, Asha</p><h3>Your day, in view.</h3></div><span className="panel-menu">•••</span></div>
          <div className="hero-panel-grid">
            <div className="panel-stat panel-stat-orange"><span className="stat-label">Attendance</span><strong>08:42</strong><span className="stat-foot"><span className="live-dot" /> Checked in</span></div>
            <div className="panel-stat panel-stat-light"><span className="stat-label">Time off</span><strong>12 <small>days</small></strong><span className="stat-foot">Available this year</span></div>
          </div>
          <div className="panel-week"><div className="week-head"><span>This week</span><span>18 – 22 Jun</span></div><div className="week-bars" aria-label="Weekly attendance: present Monday through Thursday, upcoming Friday">{['M', 'T', 'W', 'T', 'F'].map((day, index) => <div className="week-day" key={`${day}-${index}`}><span className={`week-bar ${index === 4 ? 'week-bar-empty' : ''}`} style={{ '--bar-height': `${48 + index * 9}px` } as React.CSSProperties} /><small>{day}</small></div>)}</div></div>
        </>
      )}

      {variant === 'attendance' && (
        <>
          <div className="compact-title-row"><div><p className="panel-kicker">Attendance</p><h3>Week at a glance</h3></div><span className="panel-filter">Weekly⌄</span></div>
          <div className="attendance-summary"><strong>37h 20m</strong><span>logged this week</span><div className="summary-line"><i /></div></div>
          <div className="attendance-list"><div><span>Mon 17</span><strong>08:46 — 17:32</strong><StatusChip>Present</StatusChip></div><div><span>Tue 18</span><strong>08:42 — now</strong><StatusChip>Present</StatusChip></div><div><span>Wed 19</span><strong>—</strong><StatusChip tone="neutral">Upcoming</StatusChip></div></div>
        </>
      )}

      {variant === 'leave' && (
        <>
          <div className="compact-title-row"><div><p className="panel-kicker">Leave requests</p><h3>Keep plans moving.</h3></div><span className="panel-count">2 open</span></div>
          <div className="leave-request-card"><div className="leave-date"><strong>24</strong><span>JUN</span></div><div><strong>Paid leave</strong><span>24 – 26 June · 3 days</span></div><StatusChip tone="pending">Pending</StatusChip></div>
          <div className="leave-request-card leave-request-muted"><div className="leave-date"><strong>03</strong><span>JUL</span></div><div><strong>Paid leave</strong><span>03 July · 1 day</span></div><StatusChip>Approved</StatusChip></div>
          <div className="panel-note"><span className="note-dot" /> Maya left a comment on your request</div>
        </>
      )}

      {variant === 'admin' && (
        <>
          <div className="compact-title-row"><div><p className="panel-kicker">HR overview</p><h3>People, clearly.</h3></div><span className="panel-filter">All teams⌄</span></div>
          <div className="admin-metrics"><div><strong>42</strong><span>Employees</span></div><div><strong>38</strong><span>Present today</span></div><div><strong>04</strong><span>Open requests</span></div></div>
          <div className="employee-list"><div><MiniAvatar initials="RM" tone="orange" /><span><strong>Riya Mehta</strong><small>Product design</small></span><StatusChip>Present</StatusChip></div><div><MiniAvatar initials="JC" tone="violet" /><span><strong>Jonas Cole</strong><small>Engineering</small></span><StatusChip tone="pending">On leave</StatusChip></div><div><MiniAvatar initials="NS" tone="yellow" /><span><strong>Nia Shah</strong><small>Operations</small></span><StatusChip>Present</StatusChip></div></div>
        </>
      )}
    </div>
  )
}

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page) return undefined

    const ctx = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add({ desktop: '(min-width: 800px)', reduceMotion: '(prefers-reduced-motion: reduce)' }, (conditions) => {
        const { desktop, reduceMotion } = conditions
        if (reduceMotion) { gsap.set('[data-motion]', { clearProps: 'all' }); return undefined }

        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
        intro.from('.site-nav', { y: -18, autoAlpha: 0, duration: 0.65 }).from('.hero-copy > *', { y: 24, autoAlpha: 0, duration: 0.72, stagger: 0.08 }, '-=0.35').from('.hero-art', { scale: 0.94, y: 28, autoAlpha: 0, duration: 0.95 }, '-=0.68').from('.hero-scroll-cue', { autoAlpha: 0, duration: 0.4 }, '-=0.25')

        const story = gsap.timeline({ scrollTrigger: { id: 'hero-story', trigger: '.hero-story', start: 'top top', end: desktop ? '+=1450' : '+=560', scrub: 1, pin: desktop ? '.hero-stage' : false, pinSpacing: true, anticipatePin: 1 } })
        story.to('.halftone-field', { scale: 1.15, rotation: 5, xPercent: -5, duration: 1.2, ease: 'none' }, 0).to('.hero-orbit', { rotation: 17, duration: 1.2, ease: 'none' }, 0).to('.hero-panel-wrap', { y: -32, scale: 1.06, duration: 1.2, ease: 'power2.inOut' }, 0).to('.hero-copy', { y: -100, autoAlpha: 0.25, duration: 0.8 }, 0.48).to('.hero-flow-label', { y: -12, autoAlpha: 1, duration: 0.45 }, 0.42)

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => gsap.from(element, { y: 36, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 84%', once: true } }))
        gsap.utils.toArray<HTMLElement>('.workflow-step').forEach((element, index) => gsap.from(element, { y: 18, autoAlpha: 0, duration: 0.55, delay: index * 0.06, ease: 'power2.out', scrollTrigger: { trigger: '.workflow-section', start: 'top 70%', once: true } }))

        gsap.to('.scroll-dot', { y: 6, repeat: -1, yoyo: true, duration: 0.75, ease: 'sine.inOut' })
        gsap.to('.hero-orbit', { rotation: -8, repeat: -1, yoyo: true, duration: 5.5, ease: 'sine.inOut', stagger: 0.25 })
        gsap.to('.cta-orbit span', { rotation: 360, repeat: -1, duration: 22, ease: 'none', stagger: 2 })

        gsap.utils.toArray<HTMLElement>('.feature-visual').forEach((visual, index) => {
          gsap.to(visual, { yPercent: index % 2 ? 4 : -4, ease: 'none', scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: 1.2 } })
        })
        gsap.utils.toArray<HTMLElement>('.feature-visual .dashboard-panel').forEach((panel) => {
          gsap.from(panel, { scale: 0.9, rotation: -2, y: 24, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 82%', once: true } })
        })
        gsap.from('.floating-stamp, .admin-cursor', { x: 42, rotation: 10, autoAlpha: 0, duration: 0.75, stagger: 0.14, ease: 'power3.out', scrollTrigger: { trigger: '.feature-section', start: 'top 68%', once: true } })
        gsap.from('.approval-path span', { scale: 0, transformOrigin: 'center', duration: 0.4, stagger: 0.15, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.visual-leave', start: 'top 72%', once: true } })
        gsap.from('.salary-bar i', { scaleY: 0, transformOrigin: 'bottom', duration: 0.7, stagger: 0.09, ease: 'power3.out', scrollTrigger: { trigger: '.payroll-card', start: 'top 76%', once: true } })
        gsap.to('.status-pending', { scale: 1.08, repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut', scrollTrigger: { trigger: '.panel-leave', start: 'top 78%', toggleActions: 'play pause resume pause' } })

        const interactive = gsap.utils.toArray<HTMLElement>('.button, .role-card, .feature-visual, .workflow-node')
        const cleanups = interactive.map((element: HTMLElement) => {
          const enter = () => gsap.to(element, { y: -3, scale: 1.012, duration: 0.22, ease: 'power2.out', overwrite: true })
          const leave = () => gsap.to(element, { y: 0, scale: 1, duration: 0.3, ease: 'power2.out', overwrite: true })
          element.addEventListener('pointerenter', enter)
          element.addEventListener('pointerleave', leave)
          return () => { element.removeEventListener('pointerenter', enter); element.removeEventListener('pointerleave', leave) }
        })

        const refresh = () => ScrollTrigger.refresh()
        window.addEventListener('load', refresh, { once: true })
        return () => { window.removeEventListener('load', refresh); cleanups.forEach((cleanup) => cleanup()) }
      })
      return () => media.revert()
    }, page)
    return () => ctx.revert()
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="app-shell landing-root" ref={pageRef}>
      <header className="site-nav"><a className="wordmark" href="#top" onClick={closeMenu} aria-label="Dayflow home"><span className="wordmark-mark">D</span><span>dayflow</span></a><button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen((open) => !open)}><span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span><MenuIcon open={menuOpen} /></button><nav id="main-nav" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation"><a href="#workflow" onClick={closeMenu}>Workflow</a><a href="#visibility" onClick={closeMenu}>Visibility</a><a href="#roles" onClick={closeMenu}>For teams</a><Button className="nav-cta">Get started</Button></nav></header>

      <main>
        <section className="hero-story" id="top"><div className="hero-stage"><div className="hero-copy"><p className="eyebrow">HR operations / in one flow</p><h1>Every workday,<br /><em>perfectly aligned.</em></h1><p className="hero-intro">Dayflow brings profiles, attendance, leave, approvals, and payroll visibility into one clear rhythm.</p><div className="hero-actions"><Button>Get started</Button><a className="text-link" href="#workflow">See how it works <ArrowIcon /></a></div><div className="hero-proof"><span className="proof-mark"><CheckIcon /></span><span>For people teams who keep the day moving.</span></div></div><div className="hero-art" data-motion aria-label="Dayflow employee dashboard preview"><div className="halftone-field" aria-hidden="true" /><div className="hero-orbit orbit-one" aria-hidden="true" /><div className="hero-orbit orbit-two" aria-hidden="true" /><div className="hero-panel-wrap"><DashboardPanel /></div><div className="hero-flow-label"><span className="flow-line" />profile → attendance → leave</div></div><div className="hero-scroll-cue"><span className="scroll-dot" />Scroll to move the day forward</div></div></section>

        <section className="workflow-section section-shell" id="workflow"><div className="section-intro" data-reveal><p className="eyebrow">The daily handoff</p><h2>One employee record.<br /><span>Every decision in context.</span></h2><p>From the first check-in to the final payroll view, the right information stays connected. No hunting. No crossed wires.</p></div><div className="workflow-sequence" aria-label="Dayflow workflow">{workflowSteps.map((step, index) => <div className="workflow-step" key={step.label}><div className={`workflow-node ${index === 1 ? 'node-ember' : index === 3 ? 'node-sulfur' : ''}`}><span className="workflow-number">{index + 1}</span></div><div><strong>{step.label}</strong><span>{step.detail}</span></div>{index < workflowSteps.length - 1 && <span className="workflow-connector" aria-hidden="true"><ArrowIcon /></span>}</div>)}</div></section>

        <section className="feature-section section-shell" id="visibility"><div className="feature-copy" data-reveal><p className="eyebrow">01 / Attendance</p><h2>Know where the day stands.</h2><p>Daily and weekly visibility for the people who need it. Employees check in and out. HR sees the whole picture.</p><a className="feature-link" href="#get-started">Explore attendance <ArrowIcon /></a></div><div className="feature-visual visual-attendance" data-reveal><div className="visual-marker">today / tuesday</div><DashboardPanel variant="attendance" /><div className="floating-stamp"><strong>08:42</strong><span>checked in</span></div></div></section>
        <section className="feature-section feature-reverse section-shell"><div className="feature-copy" data-reveal><p className="eyebrow">02 / Time off</p><h2>Leave the ambiguity behind.</h2><p>Paid, sick, or unpaid. Date ranges, remarks, comments, and status — all in one readable request.</p><a className="feature-link" href="#get-started">See leave in motion <ArrowIcon /></a></div><div className="feature-visual visual-leave" data-reveal><div className="visual-marker">requests / open</div><DashboardPanel variant="leave" /><div className="approval-path" aria-hidden="true"><span /><span /><span /></div></div></section>

        <section className="dark-section section-shell"><div className="dark-intro" data-reveal><p className="eyebrow eyebrow-light">A clearer control surface</p><h2>People details<br /><em>without the noise.</em></h2><p>Profiles, salary structure, and approvals live side by side — accessible to the right person, at the right moment.</p></div><div className="dark-panels"><article className="dark-card profile-card" data-reveal><div className="dark-card-top"><span className="dark-card-label">Employee profile</span><span>•••</span></div><div className="profile-identity"><div className="profile-portrait">RM</div><div><h3>Riya Mehta</h3><span>Product designer</span></div></div><div className="profile-fields"><div><span>Employee ID</span><strong>DF-0248</strong></div><div><span>Department</span><strong>Product & design</strong></div><div><span>Location</span><strong>Bengaluru, IN</strong></div></div><div className="profile-permission"><CheckIcon /> <span>Personal edits are always in their hands.</span></div></article><article className="dark-card payroll-card" data-reveal><div className="dark-card-top"><span className="dark-card-label">Salary visibility</span><span className="read-only">Read only</span></div><div className="salary-number"><span>Annual gross</span><strong>₹ 12,40,000</strong><small>Updated 01 Jun 2024</small></div><div className="salary-breakdown"><div><span>Monthly gross</span><strong>₹ 1,03,333</strong></div><div><span>Next review</span><strong>Oct 2024</strong></div></div><div className="salary-bar"><i /><i /><i /><i /><i /><i /></div></article></div></section>

        <section className="admin-section section-shell"><div className="feature-copy" data-reveal><p className="eyebrow">03 / HR overview</p><h2>Make the call.<br />Keep the context.</h2><p>Switch between employees, review attendance, and approve leave without losing your place.</p><a className="feature-link" href="#get-started">Explore the HR view <ArrowIcon /></a></div><div className="feature-visual visual-admin" data-reveal><div className="visual-marker">admin / overview</div><DashboardPanel variant="admin" /><div className="admin-cursor"><span />reviewed by you</div></div></section>

        <section className="roles-section section-shell" id="roles"><div className="roles-heading" data-reveal><p className="eyebrow">Built for the handoff</p><h2>One system.<br /><span>Two clear perspectives.</span></h2></div><div className="role-grid"><article className="role-card role-employee" data-reveal><span className="role-symbol">01</span><h3>For employees</h3><p>Your profile, attendance, leave, and salary information — in one place you can trust.</p><a href="#get-started">See your day <ArrowIcon /></a></article><article className="role-card role-admin" data-reveal><span className="role-symbol">02</span><h3>For HR / Admin</h3><p>Manage people, approvals, attendance, and salary structure from one control surface.</p><a href="#get-started">Run the view <ArrowIcon /></a></article></div></section>

        <section className="cta-section section-shell" id="get-started"><div className="cta-content" data-reveal><div className="cta-mark">D</div><p className="eyebrow">The workday, in rhythm</p><h2>Bring the workday<br /><em>into alignment.</em></h2><p>Start with a clearer way to run the day.</p><Button>Get started</Button></div><div className="cta-orbit" aria-hidden="true"><span /><span /><span /></div></section>
      </main>

      <footer className="site-footer section-shell"><a className="wordmark" href="#top"><span className="wordmark-mark">D</span><span>dayflow</span></a><span>HR operations, in one flow.</span><span>© 2024 Dayflow</span></footer>
    </div>
  )
}

