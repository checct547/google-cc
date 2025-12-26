
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Globe, 
  Video, 
  Youtube, 
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
  Link2Off,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Layout
} from 'lucide-react';
import { translations } from './translations';
import { Language, FilterLevel, OutputSettings, MediaSource, AnalysisResult } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const t = translations[lang];

  // Media State
  const [soraUrl, setSoraUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [genericUrl, setGenericUrl] = useState('');
  const [mediaSource, setMediaSource] = useState<MediaSource | null>(null);

  // Filter State
  const [filterLevel, setFilterLevel] = useState<FilterLevel>(FilterLevel.NORMAL);
  const [customFilter, setCustomFilter] = useState('');

  // Settings State
  const [outputSettings, setOutputSettings] = useState<OutputSettings>({
    duration: true,
    style: true,
    textInMedia: true,
    roles: true,
    dialogue: true,
    actionProcess: true,
    actionTrajectory: true,
    cameraProcess: true,
    cameraTrajectory: true,
    transcription: true,
    environment: true,
    atmosphere: true,
    audioElements: true,
    includeTimeline: true,
  });

  // Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const gemini = new GeminiService();

  // URL Helpers
  const isPlatformLink = (url: string) => {
    const platforms = [/tiktok\.com/i, /instagram\.com/i, /facebook\.com/i, /twitter\.com/i, /x\.com/i, /douyin\.com/i, /youtube\.com/i, /youtu\.be/i, /openai\.com\/sora/i];
    return platforms.some(p => p.test(url));
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const handleToggleSetting = (key: keyof OutputSettings) => {
    setOutputSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleParseMedia = async (type: 'sora' | 'youtube' | 'url', url: string) => {
    if (!url) return;
    setError(null);
    
    const currentUrl = url;
    setSoraUrl('');
    setYoutubeUrl('');
    setGenericUrl('');

    if (type === 'youtube' || currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be')) {
      const videoId = getYoutubeId(currentUrl);
      if (videoId) {
        setMediaSource({ type: 'youtube', value: currentUrl, previewUrl: `https://www.youtube.com/embed/${videoId}` });
        return;
      }
    }

    if (type === 'sora') {
       setMediaSource({ type: 'sora', value: currentUrl, previewUrl: currentUrl });
       return;
    }

    setMediaSource({ type, value: currentUrl, previewUrl: currentUrl });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMediaSource({ type: 'file', value: file, previewUrl });
      setError(null);
    }
    setSoraUrl('');
    setYoutubeUrl('');
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
    
    abortControllerRef.current = new AbortController();

    try {
      let analysisPayload: { data?: string; mimeType?: string; url?: string };

      if (mediaSource.type === 'file') {
        setStatusText(lang === 'zh' ? '读取本地媒体流...' : 'Reading local stream...');
        const file = mediaSource.value as File;
        const base64 = await fileToBase64(file);
        analysisPayload = { data: base64, mimeType: file.type };
        setProgress(30);
      } else {
        setStatusText(t.status.analyzing);
        analysisPayload = { url: mediaSource.value as string };
        setProgress(40);
        setError(`${t.errors.remoteAnalysis} ${t.errors.analysisAdvice}`);
      }

      const res = await gemini.analyzeMedia(analysisPayload, outputSettings, filterLevel, customFilter, lang, transcribeOnly);
      
      setResults(res);
      setStatusText(t.status.success);
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
    if (!results) return;
    const newResults = { ...results };
    delete newResults[section];
    setResults(newResults);
  };

  const getCombinedText = () => {
    if (!results) return "";
    return Object.entries(results)
      .filter(([key, val]) => key !== 'groundingUrls' && typeof val === 'string' && val.trim() !== '')
      .map(([key, val]) => {
        const title = (t.sections as any)[key] || key;
        return `### ${title}\n${val}`;
      })
      .join('\n\n');
  };

  const renderPlayer = () => {
    if (!mediaSource) return <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No Media Selected</div>;

    if (mediaSource.type === 'youtube') {
      return (
        <iframe 
          className="w-full h-full bg-black"
          src={mediaSource.previewUrl}
          title="YouTube player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }

    if (mediaSource.type === 'sora') {
      return (
        <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-white p-6 text-center">
          <Search size={48} className="mb-4 text-indigo-400 animate-pulse" />
          <p className="font-bold mb-2">Sora AI 远程内容解析</p>
          <p className="text-xs text-slate-400 mb-4 truncate max-w-xs">{mediaSource.previewUrl}</p>
          <a href={mediaSource.previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            <ExternalLink size={16} /> 在原站查看细节
          </a>
        </div>
      );
    }

    let isImage = false;
    let isAudio = false;

    if (mediaSource.type === 'file') {
      const file = mediaSource.value as File;
      isImage = file.type.startsWith('image/');
      isAudio = file.type.startsWith('audio/');
    } else {
      const rawUrl = mediaSource.previewUrl.toLowerCase();
      const urlPath = rawUrl.split('?')[0];
      isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg|img|avif|heic|tiff)$/.test(urlPath);
      isAudio = /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(urlPath);
    }

    if (isImage) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden">
          <img src={mediaSource.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-white">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center mb-4">
            <RefreshCw size={32} className="animate-spin-slow" />
          </div>
          <audio src={mediaSource.previewUrl} controls className="w-full max-w-md" />
        </div>
      );
    }

    return (
      <video 
        src={mediaSource.previewUrl} 
        controls 
        className="w-full h-full bg-black object-contain"
        onError={() => {
            if (!mediaSource.previewUrl.startsWith('blob:')) {
                setError(`${t.errors.remoteAnalysis} ${t.errors.analysisAdvice}`);
            }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto">
      <header className="w-full flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
            <Play className="text-white fill-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
            {t.title}
          </h1>
        </div>
        <button 
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-all font-medium text-gray-600 bg-white"
        >
          <Globe size={18} /> {t.langToggle}
        </button>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <Video className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  value={soraUrl}
                  onChange={(e) => setSoraUrl(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none text-sm"
                  placeholder={t.inputSora}
                />
                <button onClick={() => handleParseMedia('sora', soraUrl)} className="absolute right-2 top-2 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  {t.btnParse}
                </button>
              </div>

              <div className="relative group">
                <Youtube className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                <input 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-red-500 transition-all outline-none text-sm"
                  placeholder={t.inputYoutube}
                />
                <button onClick={() => handleParseMedia('youtube', youtubeUrl)} className="absolute right-2 top-2 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors font-medium">
                  {t.btnParse}
                </button>
              </div>

              <div className="relative group">
                <LinkIcon className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                <input 
                  value={genericUrl}
                  onChange={(e) => setGenericUrl(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 transition-all outline-none text-sm"
                  placeholder={t.inputUrl}
                />
                <button onClick={() => handleParseMedia('url', genericUrl)} className="absolute right-2 top-2 px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors font-medium">
                  {t.btnParse}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                <Upload className="w-8 h-8 mb-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm text-gray-500 group-hover:text-indigo-600">{t.inputFile}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*,image/*" />
              </label>
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl aspect-video relative group border border-slate-800">
            {renderPlayer()}
            {mediaSource && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <a 
                  href={mediaSource.previewUrl} 
                  download 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white/95 p-2 rounded-xl shadow-lg hover:bg-white transition-colors"
                  title={t.downloadLink}
                >
                  <Download size={18} className="text-slate-800" />
                </a>
                <button onClick={() => {setMediaSource(null); setError(null);}} className="bg-white/95 p-2 rounded-xl shadow-lg hover:bg-red-50 transition-colors text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw size={14} /> {t.filterLabel}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(FilterLevel).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setFilterLevel(value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    filterLevel === value 
                    ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-200' 
                    : 'bg-white border-gray-100 text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  {t.filterLevels[value]}
                </button>
              ))}
            </div>
            <input 
              value={customFilter}
              onChange={(e) => setCustomFilter(e.target.value)}
              placeholder={t.customFilterPlaceholder}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none text-sm"
            />
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckSquare size={14} /> {t.outputSettings}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
              {(Object.keys(t.sections) as Array<keyof typeof t.sections>).map((key) => {
                if (key === 'groundingUrls' || key === 'combinedOutput') return null;
                return (
                  <button
                    key={key}
                    onClick={() => handleToggleSetting(key as keyof OutputSettings)}
                    className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors text-left font-medium"
                  >
                    {outputSettings[key as keyof OutputSettings] ? <CheckSquare size={18} className="text-indigo-600 flex-shrink-0" /> : <Square size={18} className="text-gray-300 flex-shrink-0" />}
                    {t.sections[key]}
                  </button>
                );
              })}
              <div className="col-span-full pt-4 border-t border-gray-50 flex items-center gap-6">
                <button onClick={() => handleToggleSetting('includeTimeline')} className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                  <Clock size={18} className={outputSettings.includeTimeline ? 'text-indigo-600' : 'text-gray-300'} />
                  {t.timeline}
                  {outputSettings.includeTimeline ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-300" />}
                </button>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              disabled={isAnalyzing || !mediaSource}
              onClick={() => startAnalysis(false)}
              className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
            >
              {isAnalyzing && <RefreshCw className="animate-spin" size={20} />}
              {t.btnGetPrompt}
            </button>
            <button 
              disabled={isAnalyzing || !mediaSource}
              onClick={() => startAnalysis(true)}
              className="flex-1 bg-teal-500 text-white py-4 rounded-2xl font-bold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-teal-100 active:scale-95"
            >
              {t.btnTranscribeOnly}
            </button>
            {isAnalyzing && (
              <button 
                onClick={stopAnalysis}
                className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-100 flex items-center gap-2 shadow-lg shadow-red-50"
              >
                <StopCircle size={20} /> {t.btnStop}
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="space-y-3 animate-in fade-in duration-500">
              <div className="flex justify-between text-xs font-bold text-indigo-600 px-1">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-teal-400 h-full transition-all duration-700 ease-in-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className={`border p-5 rounded-2xl text-sm flex items-start gap-4 shadow-sm animate-in fade-in zoom-in duration-300 ${error.includes(t.errors.remoteAnalysis) ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <AlertCircle className={`flex-shrink-0 mt-0.5 ${error.includes(t.errors.remoteAnalysis) ? 'text-indigo-400' : 'text-red-400'}`} size={20} />
              <div className="space-y-2 whitespace-pre-wrap">
                <p className="font-bold">{error.includes(t.errors.remoteAnalysis) ? 'AI 智能提示' : t.status.error}</p>
                <p className="leading-relaxed opacity-90">{error}</p>
                {!error.includes(t.errors.remoteAnalysis) && (
                   <div className="pt-2">
                     <button 
                        onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors font-bold flex items-center gap-2"
                     >
                       <Upload size={14} /> {t.inputFile}
                     </button>
                   </div>
                )}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {results.groundingUrls && results.groundingUrls.length > 0 && (
                <div className="bg-indigo-50 rounded-2xl p-6 shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                   <h3 className="font-bold text-indigo-800 flex items-center gap-3 mb-4">
                     <ExternalLink size={18} /> {t.sections.groundingUrls}
                   </h3>
                   <div className="flex flex-wrap gap-3">
                     {results.groundingUrls.map((item, idx) => (
                       <a key={idx} href={item.uri} target="_blank" rel="noreferrer" className="bg-white px-4 py-2 rounded-xl text-xs font-medium text-indigo-600 border border-indigo-100 hover:shadow-md transition-all flex items-center gap-2">
                         {item.title} <ExternalLink size={12} />
                       </a>
                     ))}
                   </div>
                </div>
              )}

              {(Object.keys(results) as Array<keyof AnalysisResult>).map((section) => {
                const content = results[section];
                if (!content || section === 'groundingUrls') return null;

                return (
                  <div key={section} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                        {t.sections[section] || section}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(content as string)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title={t.actions.copy}>
                          <Copy size={18} />
                        </button>
                        <button onClick={() => saveToFile(`${section}.txt`, content as string)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all" title={t.actions.save}>
                          <Save size={18} />
                        </button>
                        <button onClick={() => handleDeleteSection(section as keyof AnalysisResult)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title={t.actions.delete}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="w-full h-32 p-4 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-600 focus:bg-white focus:border-indigo-100 transition-all outline-none custom-scrollbar resize-none font-mono leading-relaxed"
                      value={content as string}
                      onChange={(e) => {
                        const newResults = { ...results };
                        (newResults[section] as any) = e.target.value;
                        setResults(newResults);
                      }}
                    />
                  </div>
                );
              })}

              {/* Comprehensive Output Box */}
              {results && Object.keys(results).filter(k => k !== 'groundingUrls').length > 0 && (
                <div className="bg-indigo-600 rounded-2xl p-8 shadow-2xl shadow-indigo-200 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg flex items-center gap-3">
                      <Layout size={24} className="text-indigo-200" />
                      {t.sections.combinedOutput}
                    </h3>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => copyToClipboard(getCombinedText())} 
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all font-bold text-sm backdrop-blur-md border border-white/10"
                      >
                        <Copy size={18} /> {t.actions.copy}
                      </button>
                      <button 
                        onClick={() => saveToFile('combined_prompt.txt', getCombinedText())} 
                        className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-sm shadow-lg"
                      >
                        <Save size={18} /> {t.actions.save}
                      </button>
                    </div>
                  </div>
                  <div className="bg-indigo-700/50 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-indigo-50 leading-relaxed custom-scrollbar max-h-[500px] overflow-y-auto">
                      {getCombinedText()}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 text-slate-400 text-sm pb-8 font-medium">
        &copy; {new Date().getFullYear()} {t.title} • Gemini AI Multimodal Engine
      </footer>
    </div>
  );
};

export default App;
