import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { sound } from '../utils/audio';
import './SplashPage.css';
import './SplashPageOverrides.css';

export default function SplashPage({ onEnter }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const handleKeyDown = (event) => { if (event.key === 'Enter' || event.code === 'Space') { event.preventDefault(); sound.playClick(); onEnter(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [onEnter]);
  const toggleAudio = () => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next; sound.playClick(); };
  return <div className="civic-video-splash"><video ref={videoRef} src="/civic-lens-intro.mp4" autoPlay loop muted={muted} playsInline onLoadedData={() => setLoaded(true)} className="civic-video-splash__media" /><div className="civic-video-splash__veil" /><header className="civic-video-splash__header"><div className="civic-video-splash__brand"><span className="civic-video-splash__mark">◒</span><span>Civic<span>Lens</span></span></div><div className="civic-video-splash__status"><i /> LIVE CIVIC INTELLIGENCE NETWORK</div><button type="button" className="civic-video-splash__skip" onClick={() => { sound.playClick(); onEnter(); }}>Skip intro <Icon.ArrowRight size={14} /></button></header><main className="civic-video-splash__content"><div className="civic-video-splash__eyebrow">REPORT · VERIFY · IMPROVE</div><h1>See your city.<br /><em>Shape what’s next.</em></h1><p>One connected command center for citizens, city teams, and the public spaces they share.</p><div className="civic-video-splash__actions"><button type="button" className="civic-video-splash__enter" onClick={() => { sound.playSuccess(); onEnter(); }}>Enter CivicLens <Icon.ArrowRight size={17} /></button><button type="button" className="civic-video-splash__audio" onClick={toggleAudio}>{muted ? 'Enable sound' : 'Mute sound'} <span>{muted ? '◌' : '◉'}</span></button></div><div className="civic-video-splash__metrics"><span><b>Live map</b><small>issues in context</small></span><span><b>Photo proof</b><small>before → after</small></span><span><b>Open signal</b><small>for every resident</small></span></div></main><footer className="civic-video-splash__footer"><span><i className={loaded ? 'loaded' : ''} /> {loaded ? 'INTRO FEED READY' : 'LOADING INTRO FEED'}</span><span>Press Enter to continue</span></footer></div>;
}
