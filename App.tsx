
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
  Type as TypeIcon
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
    const platforms = [/tiktok\.com/i, /instagram\.com/i, /facebook\.com/i, /twitter\.com/i, /x\.com/i, /douyin\.com/i, /youtube\.com/i, /youtu\.be/i];
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

  // Filter sections based on BOTH user deletion and current outputSettings selection
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
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-12">
        <Monitor className="mb-4 opacity-10" size={64} />
        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">{t.status.idle}</p>
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
      else if (url.includes('youtube.com') || url.includes('youtu.be')) return (
        <div className="w-full h-full bg-slate-900 border-[3px] border-black rounded-[2rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center text-white">
           <AlertCircle className="mb-4 text-[#fbc6a4] animate-pulse" size={40} />
           <p className="text-sm font-black mb-2 uppercase tracking-tight">{t.errors.platformAdvice}</p>
           <p className="text-xs opacity-60 leading-relaxed font-medium">{t.errors.analysisAdvice}</p>
        </div>
      );
    }

    if (mimeType.startsWith('image/')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-hidden">
          <img src={mediaSource.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" onError={() => setError(t.playerError)} />
        </div>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-12 text-white">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/10">
            <RefreshCw size={40} className="animate-spin text-indigo-400" />
          </div>
          <audio src={mediaSource.previewUrl} controls className="w-full max-w-sm rounded-full filter invert" />
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
        <div className="absolute inset-0 pointer-events-none border-[12px] border-black/10 transition-all"></div>
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
    <div className="min-h-screen py-6 px-4 md:px-8 max-w-[1440px] mx-auto space-y-12">
      {/* Premium Header */}
      <header className="glass sticky top-4 z-50 p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex flex-wrap gap-4 items-center justify-between border border-white/40">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative bg-slate-900 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{t.title}</h1>
            <div className="flex items-center gap-2">
              <span className="flex w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{lang === 'zh' ? '多模态深度解析' : 'Deep Media Intelligence'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
             <button className="px-5 py-2 rounded-xl bg-white shadow-sm text-xs font-bold text-slate-900 flex items-center gap-2"><LinkIcon size={14}/> Input</button>
             <button className="px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Generate</button>
             <button className="px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Output</button>
          </nav>
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest text-slate-600 shadow-sm active:scale-95"
          >
            <Globe size={14} className="text-indigo-500" /> {t.langToggle}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Input and Media Player */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* Input Panel */}
          <section className="bg-white p-8 rounded-[3rem] card-shadow border border-slate-100 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <LinkIcon size={18} />
                </div>
                <input 
                  value={genericUrl}
                  onChange={(e) => setGenericUrl(e.target.value)}
                  className="w-full pl-14 pr-32 py-5 rounded-[2rem] bg-slate-50 border border-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-sm font-medium placeholder:text-slate-300 shadow-inner"
                  placeholder={t.inputUrl}
                  onKeyDown={(e) => e.key === 'Enter' && handleParseMedia(genericUrl)}
                />
                <button 
                  onClick={() => handleParseMedia(genericUrl)} 
                  className="absolute right-2.5 top-2.5 px-6 py-3 bg-slate-900 text-white text-xs rounded-3xl hover:bg-black transition-all font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95"
                >
                  {t.btnParse}
                </button>
              </div>

              <div className="relative overflow-hidden group">
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-200 rounded-[3rem] cursor-pointer bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group active:scale-[0.99]">
                  <div className="relative mb-3">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity rounded-full"></div>
                    <Upload className="relative w-12 h-12 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 font-black uppercase tracking-[0.25em]">{t.inputFile}</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*,image/*" />
                </label>
              </div>
            </div>
          </section>

          {/* Player Container */}
          <div className="relative">
            {youtubeId ? (
              <section className="border-[4px] border-black rounded-[2.5rem] overflow-hidden bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] max-w-2xl mx-auto transform transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                <div className="bg-[#fbc6a4] border-b-[4px] border-black px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 font-black text-black text-lg tracking-tight uppercase">
                    <Zap size={22} className="fill-black" />
                    <span>Live Monitoring</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border-[4px] border-black flex items-center justify-center bg-white">
                    <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="aspect-video rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner">
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
              <section className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-900/10 aspect-video relative group border-[4px] border-slate-900 animate-in zoom-in duration-700">
                {renderPlayer()}
                {mediaSource && (
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex gap-3">
                    <a 
                      href={mediaSource.previewUrl} 
                      download 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-white/95 p-3 rounded-2xl shadow-2xl hover:bg-white transition-all text-slate-800 active:scale-90"
                      title={t.downloadLink}
                    >
                      <Download size={20} />
                    </a>
                    <button 
                      onClick={() => {setMediaSource(null); setError(null);}} 
                      className="bg-rose-500 p-3 rounded-2xl shadow-2xl hover:bg-rose-600 transition-all text-white active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-40">
                    <Activity size={12} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Signal Locked</span>
                  </div>
                </div>
              </section>
            )}
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-100/50 p-7 rounded-[2.5rem] text-rose-800 flex items-start gap-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-rose-100 p-3 rounded-2xl text-rose-500 shrink-0 shadow-sm">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-2 whitespace-pre-wrap">
                <p className="font-black text-sm uppercase tracking-wider text-rose-900">{t.status.error}</p>
                <p className="text-[13px] leading-relaxed font-medium opacity-80">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Results */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Settings Section */}
          <section className="bg-white p-10 rounded-[3.5rem] card-shadow border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="space-y-1">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Layers size={16} className="text-indigo-500" /> {t.outputSettings}
                </h2>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-7">Dimension Configuration</p>
              </div>
              <button 
                onClick={() => handleToggleSetting('includeTimeline')} 
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${outputSettings.includeTimeline ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-400 border border-slate-100'}`}
              >
                <Clock size={16} />
                {t.timeline}
                {outputSettings.includeTimeline ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              {(Object.keys(t.sections) as Array<keyof typeof t.sections>).map((key) => (
                <button
                  key={key}
                  onClick={() => handleToggleSetting(key as keyof OutputSettings)}
                  className={`flex items-center gap-4 py-3 px-4 rounded-2xl transition-all text-xs font-bold text-left group border ${outputSettings[key as keyof OutputSettings] ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}
                >
                  <div className={`transition-all ${outputSettings[key as keyof OutputSettings] ? 'scale-110 text-indigo-600' : 'opacity-20 grayscale'}`}>
                    {outputSettings[key as keyof OutputSettings] ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <span className="truncate flex-1">{t.sections[key]}</span>
                  {outputSettings[key as keyof OutputSettings] && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                </button>
              ))}
            </div>

            {/* Sub Settings: Natural Language Synthesis Length */}
            {outputSettings.naturalLanguageSummary && (
              <div className="mt-8 pt-8 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-4">
                  <TypeIcon size={16} className="text-indigo-500" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.wordCountLabel}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={outputSettings.wordCount}
                    onChange={handleWordCountChange}
                    className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={outputSettings.wordCount}
                      onChange={handleWordCountChange}
                      className="w-20 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/10 text-center"
                    />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Words</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 pt-10 border-t border-slate-50 space-y-8">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Activity size={16} className="text-indigo-400" /> {t.filterLabel}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(FilterLevel).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setFilterLevel(value)}
                        className={`py-3 px-5 rounded-2xl text-[10px] font-black border transition-all uppercase tracking-widest active:scale-95 ${
                          filterLevel === value 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-300' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        {t.filterLevels[value]}
                      </button>
                    ))}
                  </div>
               </div>
              <div className="relative group">
                <input 
                  value={customFilter}
                  onChange={(e) => setCustomFilter(e.target.value)}
                  placeholder={t.customFilterPlaceholder}
                  className="w-full px-7 py-5 rounded-[2rem] bg-slate-50 border border-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-xs font-medium placeholder:text-slate-300 shadow-inner"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                  <Menu size={16} />
                </div>
              </div>
            </div>
          </section>

          {/* Master Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-5">
            <button 
              disabled={isAnalyzing || !mediaSource}
              onClick={() => startAnalysis(false)}
              className="flex-[2] relative overflow-hidden group bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 disabled:opacity-20 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} className="fill-white" />}
              {t.btnGetPrompt}
            </button>
            <button 
              disabled={isAnalyzing || !mediaSource}
              onClick={() => startAnalysis(true)}
              className="flex-1 bg-white text-slate-900 border-2 border-slate-100 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-[0.98] shadow-lg shadow-slate-100/50"
            >
              {t.btnTranscribeOnly}
            </button>
            {isAnalyzing && (
              <button 
                onClick={stopAnalysis}
                className="bg-rose-50 text-rose-600 px-10 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-3 active:scale-[0.98] shadow-xl shadow-rose-100/20"
              >
                <StopCircle size={20} /> {t.btnStop}
              </button>
            )}
          </div>

          {/* Progress Indicator */}
          {isAnalyzing && (
            <div className="bg-white p-10 rounded-[3rem] card-shadow border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-between items-center text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">
                <span className="flex items-center gap-3">
                   <div className="relative w-2.5 h-2.5">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
                      <div className="relative w-full h-full bg-indigo-600 rounded-full"></div>
                   </div>
                   {statusText}
                </span>
                <span className="bg-indigo-50 px-3 py-1 rounded-full">{progress}%</span>
              </div>
              <div className="w-full bg-slate-50 rounded-full h-5 p-1.5 shadow-inner overflow-hidden border border-slate-100">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 bg-[length:200%_auto] h-full rounded-full transition-all duration-700 ease-out animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Output Dashboard */}
          {results && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {visibleSections.map((section) => (
                <div key={section} className="group bg-white rounded-[3.5rem] p-10 card-shadow border border-slate-100 hover:border-indigo-100 transition-all relative overflow-hidden">
                  {/* Subtle Action Overlay */}
                  <div className="absolute top-0 right-0 p-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => copyToClipboard(results[section] || '')} className="p-3.5 bg-slate-50 rounded-[1.25rem] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90" title={t.actions.copy}>
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => saveToFile(section === 'transcription' ? 'transcription.srt' : `${section}.txt`, results[section] || '')} 
                      className="p-3.5 bg-slate-50 rounded-[1.25rem] text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all active:scale-90" 
                      title={t.actions.save}
                    >
                      <Save size={18} />
                    </button>
                    <button onClick={() => handleDeleteSection(section)} className="p-3.5 bg-rose-50 rounded-[1.25rem] text-rose-300 hover:text-rose-600 transition-all active:scale-90" title={t.actions.delete}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-2.5 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                        {t.sections[section] || section}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Generated Insight</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      className="w-full h-48 p-8 bg-slate-50 border border-slate-50 rounded-[2.5rem] text-xs text-slate-600 focus:bg-white focus:border-indigo-100 transition-all outline-none custom-scrollbar resize-none mono leading-[1.8] shadow-inner"
                      value={results[section]}
                      onChange={(e) => setResults({...results, [section]: e.target.value})}
                    />
                    <div className="absolute bottom-6 right-8 text-[9px] font-black text-slate-200 uppercase tracking-widest pointer-events-none">
                       {results[section]?.length || 0} Chars
                    </div>
                  </div>
                </div>
              ))}

              {comprehensiveOutput && (
                <div className="bg-slate-900 rounded-[4rem] p-12 shadow-2xl shadow-indigo-900/20 border-t-[8px] border-indigo-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none rotate-12">
                     <Layers size={240} />
                  </div>
                  
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 relative z-10">
                    <div className="space-y-2">
                      <h3 className="font-black text-white text-2xl flex items-center gap-5 uppercase tracking-tighter">
                        <div className="bg-indigo-500/20 p-3 rounded-2xl">
                          <Layers className="text-indigo-400" size={32} />
                        </div>
                        {t.comprehensive}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em] pl-16">{lang === 'zh' ? '多维度全景分析总览' : 'Full Landscape Intelligence Report'}</p>
                    </div>
                    <div className="flex gap-4 w-full xl:w-auto">
                      <button 
                        onClick={() => copyToClipboard(comprehensiveOutput)} 
                        className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-[1.75rem] hover:bg-slate-50 transition-all shadow-xl font-black text-[11px] uppercase tracking-widest active:scale-95 group"
                      >
                        <Copy size={18} className="transition-transform group-hover:scale-110" /> {t.actions.copy}
                      </button>
                      <button 
                        onClick={() => saveToFile('analysis_report.txt', comprehensiveOutput)} 
                        className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[1.75rem] hover:bg-indigo-700 transition-all shadow-xl font-black text-[11px] uppercase tracking-widest active:scale-95 group"
                      >
                        <Save size={18} className="transition-transform group-hover:translate-y-0.5" /> {t.actions.save}
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="bg-slate-800/40 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-700/50 min-h-[350px] whitespace-pre-wrap text-[14px] text-slate-100 mono leading-[1.8] shadow-2xl relative z-10 custom-scrollbar overflow-y-auto max-h-[700px]">
                      {comprehensiveOutput}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-indigo-500 blur-[80px] opacity-20 pointer-events-none"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Branding */}
      <footer className="mt-24 border-t border-slate-100 pt-16 text-center pb-16">
        <div className="flex items-center justify-center gap-3 mb-6 opacity-30">
           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mx-1"></div>
           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">
          &copy; {new Date().getFullYear()} {t.title} &middot; Gemini Multi-Dimensional Analysis Engine
        </p>
        <div className="flex items-center justify-center gap-8 opacity-20 grayscale hover:grayscale-0 transition-all">
           <Zap size={20} className="text-slate-400" />
           <Layers size={20} className="text-slate-400" />
           <Sparkles size={20} className="text-slate-400" />
        </div>
      </footer>
    </div>
  );
};

export default App;