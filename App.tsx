
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
  Cpu,
  Eye,
  Settings,
  ShieldCheck,
  FileVideo,
  ExternalLink
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
    setMediaSource({ type: 'url', value: url, previewUrl: url });
    setGenericUrl('');
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
        setStatusText(lang === 'zh' ? '正在编码本地文件...' : 'Encoding local file...');
        const file = mediaSource.value as File;
        const base64 = await fileToBase64(file);
        mediaData = { data: base64, mimeType: file.type };
        setProgress(30);
      } else {
        setStatusText(lang === 'zh' ? '正在请求远程流...' : 'Requesting remote stream...');
        const resp = await fetch(mediaSource.previewUrl);
        const blob = await resp.blob();
        const base64 = await fileToBase64(blob);
        mediaData = { data: base64, mimeType: blob.type || 'video/mp4' };
        setProgress(45);
      }

      setStatusText(lang === 'zh' ? 'Gemini 3.0 Pro 正在执行多模态深度解析...' : 'Gemini 3.0 Pro performing deep analysis...');
      setProgress(65);
      
      const res = await gemini.analyzeMedia(mediaData, outputSettings, filterLevel, customFilter, lang, transcribeOnly);
      
      setResults(res);
      setStatusText(lang === 'zh' ? '引擎解析完成' : 'Engine Analysis Done');
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

  const visibleSections = useMemo(() => {
    if (!results) return [];
    return (Object.keys(results) as Array<keyof AnalysisResult>)
      .filter(section => !deletedSections.has(section));
  }, [results, deletedSections]);

  const comprehensiveOutput = useMemo(() => {
    if (!results || visibleSections.length === 0) return "";
    return visibleSections
      .map(key => `[${t.sections[key as keyof typeof t.sections] || key}]\n${results[key]}\n`)
      .join('\n');
  }, [results, visibleSections, t.sections]);

  const renderPreview = () => {
    if (!mediaSource) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700 animate-pulse">
           <Monitor size={48} className="text-slate-600" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.2em]">{t.status.idle}</p>
        <p className="text-xs opacity-40 mt-2">Waiting for input signal...</p>
      </div>
    );

    const isVideo = mediaSource.previewUrl.match(/\.(mp4|webm|mov|avi)$/i) || mediaSource.type === 'file';
    const isImage = mediaSource.previewUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i);

    if (isImage) {
      return <img src={mediaSource.previewUrl} className="w-full h-full object-contain" />;
    }

    return (
      <video 
        src={mediaSource.previewUrl} 
        controls 
        className="w-full h-full object-contain"
        onError={() => setError(t.playerError)}
      />
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
      {/* Dynamic Header */}
      <header className="glass-card sticky top-6 z-[60] px-8 py-5 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {t.title}
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">v3.0 Pro</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Advanced Media Prompt Extraction Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20"><Play size={14}/> Console</button>
            <button className="px-6 py-2.5 rounded-xl text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors">History</button>
            <button className="px-6 py-2.5 rounded-xl text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors">Docs</button>
          </div>
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-[11px] uppercase tracking-widest text-indigo-400 shadow-xl active:scale-95"
          >
            <Globe size={14} /> {t.langToggle}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Input & Preview */}
        <div className="xl:col-span-5 space-y-8">
          <section className="glass-card p-8 rounded-[3rem] space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon size={18} className="text-indigo-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Media Injection</h2>
            </div>
            
            <div className="relative group">
              <input 
                value={genericUrl}
                onChange={(e) => setGenericUrl(e.target.value)}
                className="w-full pl-6 pr-32 py-5 rounded-[1.75rem] bg-slate-900/50 border border-white/5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none text-sm font-medium placeholder:text-slate-600 text-white input-glow"
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

            <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-[2rem] cursor-pointer bg-slate-900/20 hover:bg-indigo-600/5 hover:border-indigo-500/40 transition-all active:scale-[0.99]">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="bg-slate-800 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 uppercase tracking-[0.3em]">{t.inputFile}</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </section>

          <section className="glass-card aspect-video rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
            {renderPreview()}
            
            {mediaSource && (
              <div className="absolute top-6 right-6 z-20 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <button 
                  onClick={() => setMediaSource(null)}
                  className="bg-rose-500/20 backdrop-blur-md p-3 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}

            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-950/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                <Activity size={12} className="text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Signal Locked</span>
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] text-rose-300 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} className="shrink-0 mt-1" />
              <div className="text-xs leading-relaxed font-medium">{error}</div>
            </div>
          )}
        </div>

        {/* Right: Controls & Results */}
        <div className="xl:col-span-7 space-y-8">
          <section className="glass-card p-10 rounded-[3.5rem] space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{t.outputSettings}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Extraction Parameters</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleToggleSetting('includeTimeline')}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${outputSettings.includeTimeline ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}
              >
                <Clock size={16} /> {t.timeline}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {(Object.keys(t.sections) as Array<keyof typeof t.sections>).map((key) => (
                <button
                  key={key}
                  onClick={() => handleToggleSetting(key as keyof OutputSettings)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border text-left group ${outputSettings[key as keyof OutputSettings] ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10'}`}
                >
                  <div className={`transition-all ${outputSettings[key as keyof OutputSettings] ? 'text-indigo-400 scale-110' : 'opacity-20'}`}>
                    {outputSettings[key as keyof OutputSettings] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-[11px] font-bold tracking-tight truncate">{t.sections[key]}</span>
                </button>
              ))}
            </div>

            {outputSettings.naturalLanguageSummary && (
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <TypeIcon size={14} className="text-indigo-400" /> {t.wordCountLabel}
                  </div>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{outputSettings.wordCount} Words</span>
                </div>
                <input 
                  type="range" min="100" max="1000" step="50" 
                  value={outputSettings.wordCount}
                  onChange={handleWordCountChange}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-indigo-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{t.filterLabel}</span>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-white/5">
                  {Object.entries(FilterLevel).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setFilterLevel(value)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest ${filterLevel === value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
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
                className="w-full px-6 py-4 rounded-2xl bg-slate-900/50 border border-white/5 focus:border-indigo-500/50 outline-none text-xs text-white placeholder:text-slate-700 transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                disabled={isAnalyzing || !mediaSource}
                onClick={() => startAnalysis(false)}
                className="flex-[2] relative overflow-hidden group bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2.25rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 disabled:opacity-20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 glow-button"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {t.btnGetPrompt}
              </button>
              <button 
                disabled={isAnalyzing || !mediaSource}
                onClick={() => startAnalysis(true)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-6 rounded-[2.25rem] font-black text-xs uppercase tracking-[0.25em] transition-all disabled:opacity-10 active:scale-[0.98]"
              >
                {t.btnTranscribeOnly}
              </button>
              {isAnalyzing && (
                <button 
                  onClick={stopAnalysis}
                  className="bg-rose-500/20 text-rose-400 px-8 py-6 rounded-[2.25rem] font-black text-xs uppercase tracking-[0.25em] border border-rose-500/20 flex items-center gap-3"
                >
                  <StopCircle size={20} />
                </button>
              )}
            </div>
          </section>

          {isAnalyzing && (
            <div className="glass-card p-10 rounded-[3.5rem] space-y-6 animate-in zoom-in duration-500">
              <div className="flex justify-between items-center text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                  {statusText}
                </span>
                <span className="px-3 py-1 bg-indigo-500/10 rounded-lg">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950/60 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 via-sky-400 to-indigo-500 rounded-full transition-all duration-700 ease-out animate-pulse" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {visibleSections.map((section) => (
                <div key={section} className="glass-card rounded-[3rem] p-8 space-y-6 relative overflow-hidden group border-white/5 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{t.sections[section] || section}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">AI Perception Result</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button onClick={() => copyToClipboard(results[section] || '')} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Copy size={16}/></button>
                      <button onClick={() => saveToFile(`${section}.txt`, results[section] || '')} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Save size={16}/></button>
                    </div>
                  </div>
                  
                  <textarea
                    className="w-full h-40 p-6 bg-slate-950/40 rounded-[2rem] border border-white/5 text-[13px] text-slate-300 focus:border-indigo-500/30 transition-all outline-none mono leading-relaxed custom-scrollbar resize-none"
                    value={results[section]}
                    onChange={(e) => setResults({...results, [section]: e.target.value})}
                  />
                </div>
              ))}

              {comprehensiveOutput && (
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-950/90 backdrop-blur-2xl rounded-[4rem] p-12 border border-indigo-500/20 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 relative z-10">
                    <div>
                      <h3 className="text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
                        <Layers className="text-indigo-400" size={32} />
                        {t.comprehensive}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">Omni-Channel Intelligence Report</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => copyToClipboard(comprehensiveOutput)} 
                        className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Copy size={16} /> {t.actions.copy}
                      </button>
                      <button 
                        onClick={() => saveToFile('analysis.txt', comprehensiveOutput)} 
                        className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> {t.actions.save}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/40 rounded-[2.5rem] p-8 border border-white/5 text-sm text-slate-300 mono leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar whitespace-pre-wrap relative z-10">
                    {comprehensiveOutput}
                  </div>
                  
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] -z-10" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-20 pt-16 border-t border-white/5 pb-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] mb-4">
          &copy; {new Date().getFullYear()} {t.title} &middot; Multimodal Neural Core
        </p>
        <div className="flex items-center justify-center gap-8 opacity-20 grayscale hover:grayscale-0 transition-all duration-500 cursor-help">
           <Cpu size={18} />
           <Eye size={18} />
           <ShieldCheck size={18} />
        </div>
      </footer>
    </div>
  );
};

export default App;
