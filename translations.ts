
export const translations = {
  zh: {
    title: '音频视频获取提示',
    langToggle: 'English',
    inputSora: 'Sora 专用 URL 输入',
    inputYoutube: 'YouTube 专用 URL 输入',
    inputUrl: '普通 URL (图像/音频/视频)',
    inputFile: '本地上传媒体',
    btnParse: '解析媒体',
    btnUpload: '上传并播放',
    playerError: '播放器无法直接解码，建议点击右上方下载图标到本地播放。',
    downloadLink: '下载媒体',
    filterLabel: '提示词过滤级别',
    filterLevels: {
      NORMAL: '正常',
      GENERAL: '一般',
      STRICT: '严格',
      EXTREME: '极致'
    },
    customFilterPlaceholder: '添加自定义过滤关键词...',
    btnGetPrompt: '确定获取提示词',
    btnTranscribeOnly: '单独转录语音文本',
    btnStop: '停止解析',
    outputSettings: '提示词输出设置',
    timeline: '时间轴',
    sections: {
      duration: '时长',
      style: '风格',
      textInMedia: '媒体文字',
      roles: '角色分类',
      dialogue: '人物台词',
      actionProcess: '动作过程',
      actionTrajectory: '动作轨迹',
      cameraProcess: '镜头运动',
      cameraTrajectory: '镜头轨迹',
      transcription: '转录文本 (SRT)',
      environment: '环境',
      atmosphere: '氛围',
      audioElements: '音频元素',
      groundingUrls: '参考来源链接',
      combinedOutput: '综合输出'
    },
    actions: {
      copy: '复制',
      save: '保存',
      edit: '编辑',
      delete: '删除'
    },
    status: {
      idle: '就绪',
      parsing: '解析媒体中...',
      analyzing: 'AI 正在远程分析（通过 Search Grounding）...',
      localAnalyzing: 'AI 正在分析本地媒体流...',
      error: '发生错误',
      success: '分析完成'
    },
    errors: {
      platformBlocked: '此链接属于社交平台网页（如 TikTok/YouTube/Instagram）。',
      remoteAnalysis: 'AI 将启动远程解析模式，通过 Google Search 获取视频内容细节。',
      analysisAdvice: '为了获取更精确的视觉动作轨迹，推荐下载视频后通过“本地上传”提交。',
      invalidUrl: '输入的 URL 格式不正确。',
      corsError: '目标服务器拒绝了跨域访问请求。',
      youtubeSuccess: 'YouTube 预览已加载。'
    }
  },
  en: {
    title: 'Audio/Video Prompt Acquisition',
    langToggle: '中文',
    inputSora: 'Sora URL Input',
    inputYoutube: 'YouTube URL Input',
    inputUrl: 'Generic URL (Image/Audio/Video)',
    inputFile: 'Local Media Upload',
    btnParse: 'Parse Media',
    btnUpload: 'Upload & Play',
    playerError: 'Player cannot decode directly; click download icon to play locally.',
    downloadLink: 'Download Media',
    filterLabel: 'Prompt Filter Level',
    filterLevels: {
      NORMAL: 'Normal',
      GENERAL: 'General',
      STRICT: 'Strict',
      EXTREME: 'Extreme'
    },
    customFilterPlaceholder: 'Add custom filter keywords...',
    btnGetPrompt: 'Get Prompt',
    btnTranscribeOnly: 'Transcribe Audio Only',
    btnStop: 'Stop',
    outputSettings: 'Output Configuration',
    timeline: 'Timeline',
    sections: {
      duration: 'Duration',
      style: 'Style',
      textInMedia: 'Text in Media',
      roles: 'Roles/Objects',
      dialogue: 'Dialogues',
      actionProcess: 'Action Process',
      actionTrajectory: 'Action Trajectory',
      cameraProcess: 'Camera Movement',
      cameraTrajectory: 'Camera Trajectory',
      transcription: 'Transcription (SRT)',
      environment: 'Environment',
      atmosphere: 'Atmosphere',
      audioElements: 'Audio Elements',
      groundingUrls: 'Reference Sources',
      combinedOutput: 'Combined Output'
    },
    actions: {
      copy: 'Copy',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete'
    },
    status: {
      idle: 'Ready',
      parsing: 'Parsing media...',
      analyzing: 'AI Analyzing Remotely (via Search Grounding)...',
      localAnalyzing: 'AI Analyzing local media stream...',
      error: 'An error occurred',
      success: 'Done'
    },
    errors: {
      platformBlocked: 'Detected platform page (e.g., TikTok/YouTube/Instagram).',
      remoteAnalysis: 'AI is starting remote analysis mode using Google Search for content details.',
      analysisAdvice: 'For precise trajectory analysis, downloading and using "Local Upload" is recommended.',
      invalidUrl: 'The entered URL format is invalid.',
      corsError: 'Target server refused cross-origin request.',
      youtubeSuccess: 'YouTube preview loaded.'
    }
  }
};
