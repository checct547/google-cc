
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Link as LinkIcon, 
  Upload, 
  Play, 
  Download, 
  Trash2, 
  Copy, 
  Save, 
  StopCircle, 
  RefreshCw, 
  Clock, 
  CheckSquare, 
  Square, 
  AlertCircle,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Monitor,
  ChevronRight,
  Menu,
  Type as TypeIcon,
  ShieldCheck
} from 'lucide-react';
import { translations } from './translations';
import { Language, FilterLevel, OutputSettings, MediaSource, AnalysisResult } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const t = translations[lang];

  // Media State
  const [genericUrl, setGenericUrl] = useState('');
  const [mediaSource, setMediaSource] = useState<MediaSource | null>(null);

  // Filter State
  const [filterLevel, setFilterLevel] = useState<FilterLevel>(FilterLevel.NORMAL);
  const [customFilter, setCustomFilter] = useState('');

  // Settings State
  const [outputSettings, setOutputSettings] = useState<OutputSettings>({
    durationTransitions: true,
    rolesObjects: true,
    actionTrajectory: true,
    artVisualStyle: true,
    dialogueEmotions: true,
    cinematographyTech: true,
    physicalEnvironment: true,
    textRecognition: true,
    actionPhysicality: true,
    cameraPathing: true,
    transcription: true,
    psychologicalAtmosphere: true,
    audioLayering: true,
    limbMovements: true,
    bodyMovements: true,
    facialExpressions: true,
    eyeDetail: true,
    includeTimeline: true,
    naturalLanguageSummary: true,
    wordCount: 300,
  });

  // Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [deletedSections, setDeletedSections] = useState<Set<keyof AnalysisResult>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const gemini = new GeminiService();

  // Robust URL Helpers
  const isPlatformLink = (url: string) => {
    const platforms = [/tiktok\.com/i, /instagram\.com/i, /facebook\.com/i, /twitter\.com/i, /x\.com/i, /douyin\.com/i, /youtube\.com/i, /youtu\.be/i, /klingai\.com/i];
    return platforms.some(p => p.test(url));
  };

  const handleToggleSetting = (key: keyof OutputSettings) => {
    setOutputSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWordCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setOutputSettings(prev => ({ ...prev, wordCount: val }));
  };

  const handleParseMedia = async (url: string) => {
    if (!url) return;
    setError(null);
    const currentUrl = url;
    setGenericUrl('');

    if (isPlatformLink(currentUrl)) {
      setError(`${t.errors.platformBlocked} ${t.errors.platformAdvice} ${t.errors.analysisAdvice}`);
      setMediaSource({ type: 'url', value: currentUrl, previewUrl: currentUrl });
      return;
    }
    
    setMediaSource({ type: 'url', value: currentUrl, previewUrl: currentUrl });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMediaSource({ type: 'file', value: file, previewUrl });
      setError(null);
    }
    setGenericUrl('');
    e.target.value = ''; 
  };

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const crawlMedia = async (url: string): Promise<{ data: string, mimeType: string }> => {
    setStatusText(lang === 'zh' ? '正在尝试抓取媒体流...' : 'Attempting to capture stream...');
    setProgress(15);

    try {
      let response = await fetch(url);
      if (!response.ok) {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        response = await fetch(proxyUrl);
      }
      if (!response.ok) throw new Error(t.errors.corsError);

      const blob = await response.blob();
      setProgress(45);
      const base64 = await fileToBase64(blob);
      return { data: base64, mimeType: blob.type || 'video/mp4' };
    } catch (e: any) {
      const msg = isPlatformLink(url) 
        ? `${t.errors.platformBlocked}\n${t.errors.platformAdvice}\n${t.errors.analysisAdvice}`
        : `${e.message}. ${t.playerError}`;
      throw new Error(msg);
    }
  };

  const startAnalysis = async (transcribeOnly: boolean = false) => {
    if (!mediaSource) return;
    setIsAnalyzing(true);
    setProgress(5);
    setError(null);
    setResults(null);
    setDeletedSections(new Set());
    
    abortControllerRef.current = new AbortController();

    try {
      let mediaData: { data: string; mimeType: string };

      if (mediaSource.type === 'file') {
        setStatusText(lang === 'zh' ? '读取本地媒体文件...' : 'Reading local file...');
        const file = mediaSource.value as File;
        const base64 = await fileToBase64(file);
        mediaData = { data: base64, mimeType: file.type };
        setProgress(30);
      } else {
        mediaData = await crawlMedia(mediaSource.previewUrl);
      }

      setStatusText(lang === 'zh' ? 'AI 正在进行深度多维分析...' : 'AI performing deep multi-dimensional analysis...');
      setProgress(60);
      
      const res = await gemini.analyzeMedia(mediaData, outputSettings, filterLevel, customFilter, lang, transcribeOnly);
      
      setResults(res);
      setStatusText(lang === 'zh' ? '分析完成' : 'Analysis Complete');
      setProgress(100);
      setIsAnalyzing(false);
    } catch (e: any) {
      setError(e.message);
      setIsAnalyzing(false);
      setProgress(0);
      setStatusText('');
    }
  };

  const stopAnalysis = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsAnalyzing(false);
    setProgress(0);
    setStatusText('');
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const saveToFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSection = (section: keyof AnalysisResult) => {
    setDeletedSections(prev => {
      const next = new Set(prev);
      next.add(section);
      return next;
    });
  };

  const visibleSections = useMemo(() => {
    if (!results) return [];
    return (Object.keys(results) as Array<keyof AnalysisResult>)
      .filter(section => 
        !deletedSections.has(section) && 
        (outputSettings as any)[section] === true
      );
  }, [results, deletedSections, outputSettings]);

  const comprehensiveOutput = useMemo(() => {
    if (!results || visibleSections.length === 0) return "";
    return visibleSections
      .map(key => {
        const title = t.sections[key as keyof typeof t.sections] || key;
        return `[${title}]\n${results[key]}\n`;
      })
      .join('\n');
  }, [results, visibleSections, t.sections]);

  const renderPlayer = () => {
    if (!mediaSource) return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-12">
        <Monitor className="mb-4 opacity-10" size={64} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">{t.status.idle}</p>
      </div>
    );
    
    let mimeType = '';
    if (mediaSource.type === 'file') {
      mimeType = (mediaSource.value as File).type;
    } else {
      const url = mediaSource.previewUrl.toLowerCase().split('?')[0];
      if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic|tiff|ico)$/.test(url)) mimeType = 'image/jpeg';
      else if (/\.flac$/.test(url)) mimeType = 'audio/flac';
      else if (/\.(mp3|wav|ogg|m4a|aac|opus|mid|midi)$/.test(url)) mimeType = 'audio/mpeg';
      else if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|m4v|3gp|3g2)$/.test(url)) mimeType = 'video/mp4';
      else if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('klingai.com')) return (
        <div className="w-full h-full bg-slate-900 border-[3px] border-slate-800 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center text-white">
           <AlertCircle className="mb-4 text-amber-400 animate-pulse" size={40} />
           <p className="text-sm font-black mb-2 uppercase tracking-tight">{t.errors.platformAdvice}</p>
           <p className="text-xs opacity-60 leading-relaxed font-medium">{t.errors.analysisAdvice}</p>
        </div>
      );
    }

    if (mimeType.startsWith('image/')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black/20 overflow-hidden">
          <img src={mediaSource.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" onError={() => setError(t.playerError)} />
        </div>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-12 text-white">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-2xl">
            <RefreshCw size={40} className="animate-spin text-indigo-400" />
          </div>
          <audio src={mediaSource.previewUrl} controls className="w-full max-w-sm rounded-full filter invert brightness-150" />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full bg-black group">
        <video 
          src={mediaSource.previewUrl} 
          controls 
          className="w-full h-full object-contain"
          onError={() => setError(t.playerError)}
        />
        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 transition-all"></div>
      </div>
    );
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = useMemo(() => {
    if (mediaSource?.type === 'url' && typeof mediaSource.value === 'string') {
      return getYoutubeId(mediaSource.value);
    }
    return null;
  }, [mediaSource]);

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-[1440px] mx-auto space-y-10 animate-in fade-in duration-1000">
      {/* Dynamic Glass Header */}
      <header className="glass-card sticky top-6 z-50 px-8 py-5 rounded-[2.5rem] flex flex-wrap gap-6 items-center justify-between border-white/10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 rounded-full animate-pulse"></div>
            <div className="relative bg-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-600/20 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Sparkles className="text-white" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">{t.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{lang === 'zh' ? '多模态深度解析 v3.0 Pro' : 'Deep Media Intelligence v3.0 Pro'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-[11px] uppercase tracking-widest text-indigo-400 shadow-xl active:scale-95"
          >
            <Globe size={16} /> {t.langToggle}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Input and Media Player */}
        <div className="lg:col-span-5 flex flex-col gap-10">
          {/* Input Panel */}
          <section className="glass-card p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-left-8 duration-700">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <LinkIcon size={20} />
                </div>
                <input 
                  value={genericUrl}
                  onChange={(e) => setGenericUrl(e.target.value)}
                  className="w-full pl-16 pr-32 py-5 rounded-[1.75rem] bg-slate-900/50 border border-white/5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none text-sm font-medium placeholder:text-slate-600 text-white"
                  placeholder={t.inputUrl}
                  onKeyDown={(e) => e.key === 'Enter' && handleParseMedia(genericUrl)}
                />
                <button 
                  onClick={() => handleParseMedia(genericUrl)} 
                  className="absolute right-2.5 top-2.5 px-6 py-3 bg-indigo-600 text-white text-[11px] rounded-2xl hover:bg-indigo-500 transition-all font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  {t.btnParse}
                </button>
              </div>

              <div className="relative group">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer bg-slate-900/20 hover:bg-indigo-600/5 hover:border-indigo-500/40 transition-all group active:scale-[0.99]">
                  <div className="bg-slate-800 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 uppercase tracking-[0.3em]">{t.inputFile}</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*,image/*" />
                </label>
              </div>
            </div>
          </section>

          {/* Player Container */}
          <div className="relative">
            {youtubeId ? (
              <section className="glass-card rounded-[3rem] overflow-hidden border border-white/10">
                <div className="bg-indigo-600/10 border-b border-white/5 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 font-black text-white text-sm tracking-widest uppercase">
                    <Activity size={18} className="text-emerald-400 animate-pulse" />
                    <span>Live Stream Active</span>
                  </div>
                </div>
                <div className="p-6 bg-black/40">
                  <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/50">
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </section>
            ) : (
              <section className="glass-card rounded-[3rem] overflow-hidden aspect-video relative group border border-white/10 shadow-2xl animate-in zoom-in duration-700">
                {renderPlayer()}
                {mediaSource && (
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex gap-3 z-10">
                    <button 
                      onClick={() => {setMediaSource(null); setError(null);}} 
                      className="bg-rose-500/20 backdrop-blur-md p-3.5 rounded-2xl border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                  <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                    <Activity size={12} className="text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Signal Locked</span>
                  </div>
                </div>
              </section>
            )}
          </div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[3rem] text-rose-300 flex items-start gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-rose-500/20 p-3.5 rounded-2xl text-rose-400 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-2">
                <p className="font-black text-xs uppercase tracking-[0.2em] text-rose-400">{t.status.error}</p>
                <p className="text-[13px] leading-relaxed font-medium opacity-80">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Results */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          {/* Settings Section */}
          <section className="glass-card p-12 rounded-[4rem] animate-in slide-in-from-right-8 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div className="space-y-1">
                <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Layers size={18} className="text-indigo-400" /> {t.outputSettings}
                </h2>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-8">Engine Parameters</p>
              </div>
              <button 
                onClick={() => handleToggleSetting('includeTimeline')} 
                className={`flex items-center gap-4 px-8 py-4 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${outputSettings.includeTimeline ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}
              >
                <Clock size={16} />
                {t.timeline}
                {outputSettings.includeTimeline ? <CheckSquare size={18} className="text-white" /> : <Square size={18} />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(t.sections) as Array<keyof typeof t.sections>).map((key) => (
                <button
                  key={key}
                  onClick={() => handleToggleSetting(key as keyof OutputSettings)}
                  className={`flex items-center gap-4 py-4 px-5 rounded-2xl transition-all text-[11px] font-bold text-left group border ${outputSettings[key as keyof OutputSettings] ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10'}`}
                >
                  <div className={`transition-all ${outputSettings[key as keyof OutputSettings] ? 'scale-110 text-indigo-400' : 'opacity-20'}`}>
                    {outputSettings[key as keyof OutputSettings] ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <span className="truncate flex-1 uppercase tracking-tight">{t.sections[key]}</span>
                </button>
              ))}
            </div>

            {outputSettings.naturalLanguageSummary && (
              <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TypeIcon size={18} className="text-indigo-400" />
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.wordCountLabel}</h3>
                  </div>
                  <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">{outputSettings.wordCount} Words</span>
                </div>
                <div className="flex items-center gap-6">
                  <input 
                    type="range" min="100" max="1000" step="50"
                    value={outputSettings.wordCount}
                    onChange={handleWordCountChange}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                    <ShieldCheck size={18} className="text-indigo-400" /> {t.filterLabel}
                  </h3>
                  <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                    {Object.entries(FilterLevel).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setFilterLevel(value)}
                        className={`py-2.5 px-6 rounded-[1rem] text-[10px] font-black transition-all uppercase tracking-widest active:scale-95 ${
                          filterLevel === value 
                          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                          : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t.filterLevels[value]}
                      </button>
                    ))}
                  </div>
               </div>
              <input 
                value={customFilter}
                onChange={(e) => setCustomFilter(e.target.value)}
                placeholder={t.customFilterPlaceholder}
                className="w-full px-8 py-5 rounded-[1.75rem] bg-slate-900/50 border border-white/5 focus:bg-slate-900 focus:border-indigo-500/50 transition-all outline-none text-[13px] text-white placeholder:text-slate-700 shadow-inner"
              />
            </div>
          </section>

          {/* Master Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              disabled={isAnalyzing || !mediaSource}
              onClick={() => startAnalysis(false)}
              className="flex-[2] btn-primary text-white py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] disabled:opacity-20 disabled:shadow-none flex items-center justify-center gap-4 group"
            >
              {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
              {t.btnGetPrompt}
            </button>
            <button 
              disabled={isAnalyzing || !mediaSource}
              onClick={() => startAnalysis(true)}
              className="flex-1 bg-white/5 text-white border border-white/10 py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-white/10 transition-all disabled:opacity-20 shadow-xl"
            >
              {t.btnTranscribeOnly}
            </button>
            {isAnalyzing && (
              <button 
                onClick={stopAnalysis}
                className="bg-rose-500/20 text-rose-400 px-10 py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.25em] border border-rose-500/20 flex items-center gap-3 active:scale-[0.98]"
              >
                <StopCircle size={20} /> {t.btnStop}
              </button>
            )}
          </div>

          {/* Progress Indicator */}
          {isAnalyzing && (
            <div className="glass-card p-12 rounded-[3.5rem] space-y-8 animate-in zoom-in duration-500">
              <div className="flex justify-between items-center text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">
                <span className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                   {statusText}
                </span>
                <span className="bg-indigo-500/10 px-4 py-1.5 rounded-full">{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-4 p-1 shadow-inner border border-white/5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Output Dashboard */}
          {results && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              {visibleSections.map((section) => (
                <div key={section} className="group glass-card rounded-[3.5rem] p-10 relative overflow-hidden transition-all hover:border-indigo-500/30">
                  <div className="absolute top-8 right-10 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-10">
                    <button onClick={() => copyToClipboard(results[section] || '')} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90 shadow-xl" title={t.actions.copy}>
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => saveToFile(section === 'transcription' ? 'transcription.srt' : `${section}.txt`, results[section] || '')} 
                      className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90 shadow-xl" 
                      title={t.actions.save}
                    >
                      <Save size={18} />
                    </button>
                    <button onClick={() => handleDeleteSection(section)} className="p-3 bg-rose-500/10 rounded-xl text-rose-400 hover:text-rose-500 transition-all active:scale-90 shadow-xl" title={t.actions.delete}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-1.5 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/40" />
                    <div>
                      <h3 className="font-black text-white text-base uppercase tracking-widest">
                        {t.sections[section] || section}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Neural Insight Core</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      className="w-full h-56 p-8 bg-black/40 border border-white/5 rounded-[2.5rem] text-[13px] text-slate-300 focus:border-indigo-500/30 transition-all outline-none mono leading-[1.8] custom-scrollbar resize-none"
                      value={results[section]}
                      onChange={(e) => setResults({...results, [section]: e.target.value})}
                    />
                    <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-700 uppercase tracking-widest pointer-events-none">
                       {results[section]?.length || 0} CHR
                    </div>
                  </div>
                </div>
              ))}

              {comprehensiveOutput && (
                <div className="bg-slate-950/80 backdrop-blur-3xl rounded-[4rem] p-12 border border-indigo-500/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[150px] -z-10 animate-pulse"></div>
                  
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 mb-12">
                    <div className="space-y-3">
                      <h3 className="font-black text-white text-3xl flex items-center gap-6 uppercase tracking-tighter">
                        <div className="bg-indigo-600/20 p-4 rounded-3xl shadow-2xl border border-indigo-500/20">
                          <Layers className="text-indigo-400" size={32} />
                        </div>
                        {t.comprehensive}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.5em] pl-20">{lang === 'zh' ? '多维度全景分析总览' : 'Full Spectrum Intelligence Report'}</p>
                    </div>
                    <div className="flex gap-4 w-full xl:w-auto">
                      <button 
                        onClick={() => copyToClipboard(comprehensiveOutput)} 
                        className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-white text-slate-950 rounded-[2rem] hover:bg-slate-100 transition-all shadow-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 group"
                      >
                        <Copy size={20} className="group-hover:scale-110 transition-transform" /> {t.actions.copy}
                      </button>
                      <button 
                        onClick={() => saveToFile('intelligence_report.txt', comprehensiveOutput)} 
                        className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 group"
                      >
                        <Save size={20} className="group-hover:-translate-y-1 transition-transform" /> {t.actions.save}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-black/60 rounded-[3rem] p-10 border border-white/5 min-h-[400px] whitespace-pre-wrap text-[15px] text-slate-200 mono leading-[1.8] custom-scrollbar overflow-y-auto max-h-[800px] shadow-inner">
                    {comprehensiveOutput}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Aesthetic Footer */}
      <footer className="mt-32 pt-20 border-t border-white/5 text-center pb-20">
        <div className="flex items-center justify-center gap-2 mb-8 opacity-20">
           <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse"></div>
           <div className="w-2 h-2 bg-indigo-500 rounded-full mx-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
           <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.8em] mb-6">
          &copy; {new Date().getFullYear()} {t.title} &middot; NEURAL MEDIA ENGINE PRO
        </p>
        <div className="flex items-center justify-center gap-10 opacity-10 grayscale hover:grayscale-0 transition-all duration-700">
           <Zap size={24} />
           <Layers size={24} />
           <Monitor size={24} />
           <Sparkles size={24} />
        </div>
      </footer>
    </div>
  );
};

export default App;