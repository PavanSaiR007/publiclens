import React, { useState } from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';

export default function AuthModal({ onLogin }) {
  const [role, setRole] = useState('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const handleQuickLogin = (demoRole, demoEmail, demoName) => {
    sound.playSuccess();
    onLogin({ email: demoEmail, role: demoRole, name: demoName });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sound.playSuccess();
    onLogin({
      email: email.trim().toLowerCase(),
      role,
      name: name.trim() || email.split('@')[0] || (role === 'admin' ? 'City Agent' : 'Neighbor')
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <video
        src="/civiclens-login-loop.mp4"
        className="fixed inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="Cinematic CivicLens city transport video"
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/15 to-slate-950/30" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/20" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7 lg:px-16">
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/20 px-3 py-2 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-emerald-100"><Icon.Shield size={21} /></div>
          <div><b className="text-lg tracking-tight">Civic<span className="text-emerald-200">Lens</span></b><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">Community response</p></div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-slate-950/25 px-4 py-2 text-[10px] font-bold tracking-[0.14em] text-white/90 backdrop-blur-md sm:inline-flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> CITY NETWORK ONLINE</span>
      </header>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] items-center justify-between gap-10 px-5 pb-16 pt-28 sm:px-10 lg:px-16">
        <section className="hidden max-w-2xl flex-1 pb-8 lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/25 px-4 py-2 text-xs font-semibold text-white/95 backdrop-blur-md"><Icon.MapPin size={14} /> REPORT · TRACK · IMPROVE</span>
          <h1 className="mt-7 max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-lg xl:text-6xl">See your city.<br /><span className="text-emerald-200">Shape what’s next.</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/90 drop-shadow-md">A shared place for neighbors to report local issues and city teams to show visible progress.</p>
          <div className="mt-9 flex flex-wrap gap-3">{[['01', 'Report'], ['02', 'Track'], ['03', 'Verify']].map(([number, label]) => <div key={number} className="min-w-28 rounded-2xl border border-white/20 bg-slate-950/25 px-4 py-3 backdrop-blur-md"><span className="block text-xs font-bold text-emerald-200">{number}</span><b className="mt-1 block text-sm text-white">{label}</b></div>)}</div>
        </section>

        <section className="ml-auto w-full max-w-[470px] rounded-[28px] border border-emerald-50/30 bg-gradient-to-br from-emerald-900/35 via-emerald-950/25 to-slate-900/35 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_30px_100px_-28px_rgba(0,0,0,0.58)] backdrop-blur-2xl backdrop-saturate-150 sm:p-7 lg:p-8">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Welcome to CivicLens</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Choose your workspace</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">Citizens submit and follow reports. City agents review requests and coordinate response.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { id: 'citizen', title: 'Citizen', copy: 'Report and track local issues', icon: <Icon.User size={18} /> },
              { id: 'admin', title: 'City agent', copy: 'Review and route requests', icon: <Icon.Shield size={18} /> }
            ].map((option) => <button key={option.id} type="button" onClick={() => { sound.playClick(); setRole(option.id); }} className={`rounded-2xl border p-3 text-left transition sm:p-4 ${role === option.id ? 'border-emerald-200 bg-emerald-300/15 ring-2 ring-emerald-200/20' : 'border-white/15 bg-white/5 hover:border-white/35 hover:bg-white/10'}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${role === option.id ? 'bg-emerald-300 text-slate-950' : 'bg-white/10 text-white/85'}`}>{option.icon}</span><b className="mt-2.5 block text-sm text-white">{option.title}</b><span className="mt-1 block text-xs leading-5 text-white/65">{option.copy}</span></button>)}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {role === 'citizen' && <label className="block"><span className="mb-1.5 block text-sm font-semibold text-white/90">Your name</span><input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-200/15" placeholder="e.g. Alex Morgan" autoComplete="name" /></label>}
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-white/90">Email address</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-200/15" placeholder={role === 'admin' ? 'agent@city.gov' : 'you@example.com'} autoComplete="email" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-white/90">Password</span><input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-emerald-200 focus:ring-4 focus:ring-emerald-200/15" placeholder="Enter your password" autoComplete="current-password" /></label>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-200/25">Continue to {role === 'admin' ? 'agent workspace' : 'citizen dashboard'} <Icon.ArrowRight size={16} /></button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-white/55"><span className="h-px flex-1 bg-white/20" /> Quick preview <span className="h-px flex-1 bg-white/20" /></div>
          <div className="grid grid-cols-2 gap-3"><button onClick={() => handleQuickLogin('citizen', 'jordan.davis@civiclens.local', 'Jordan Davis')} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white/85 transition hover:bg-white/15">Preview citizen</button><button onClick={() => handleQuickLogin('admin', 'elena.vance@cityops.gov', 'Elena Vance')} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white/85 transition hover:bg-white/15">Preview agent</button></div>
          <p className="mt-4 text-center text-[10px] leading-4 text-white/60">Demo access is for project previews. Production requires a verified authentication service.</p>
        </section>
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-5 pb-5 sm:px-10 sm:pb-7 lg:px-16">
        <span className="rounded-full border border-white/15 bg-slate-950/25 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-md">CivicLens · City in motion</span>
        <span className="rounded-lg border border-white/25 bg-slate-950/90 px-3 py-1.5 text-xs font-bold tracking-wide text-white shadow-lg">CivicLens</span>
      </footer>
    </main>
  );
}
