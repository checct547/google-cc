export const translations = {
  zh: {
    title: '音频视频获取提示',
    langToggle: 'English',
    inputUrl: '输入媒体 URL (图像/音频/视频)',
    inputFile: '本地上传媒体 (推荐用于社交平台视频)',
    btnParse: '解析媒体',
    btnUpload: '上传并播放',
    playerError: '无法直接播放，该链接可能受保护或格式不支持。',
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
    comprehensive: '综合输出',
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
      audioElements: '音频元素'
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
      analyzing: 'AI 正在分析并生成结果...',
      error: '发生错误',
      success: '完成'
    },
    errors: {
      platformBlocked: '由于平台安全策略限制，浏览器无法直接解析社交平台（如 YouTube/TikTok）的视频流。',
      platformAdvice: 'AI 无法直接从 YouTube 页面“抓取”视频。',
      analysisAdvice: '请先将视频下载到本地，然后通过“本地上传”功能提交给 AI 解析。',
      invalidUrl: '输入的 URL 格式不正确。',
      corsError: '目标服务器拒绝了跨域访问请求。'
    }
  },
  en: {
    title: 'Audio/Video Prompt Acquisition',
    langToggle: '中文',
    inputUrl: 'Enter Media URL (Image/Audio/Video)',
    inputFile: 'Local Media Upload (Recommended for social platforms)',
    btnParse: 'Parse Media',
    btnUpload: 'Upload & Play',
    playerError: 'Cannot play directly; link may be protected or format unsupported.',
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
    comprehensive: 'Comprehensive Output',
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
      audioElements: 'Audio Elements'
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
      analyzing: 'AI Analyzing...',
      error: 'An error occurred',
      success: 'Done'
    },
    errors: {
      platformBlocked: 'Due to security policies, the browser cannot directly parse social platform (e.g., YouTube) video streams.',
      platformAdvice: 'AI cannot "crawl" videos directly from the YouTube player page.',
      analysisAdvice: 'Please download the video locally and use "Local Upload" for AI analysis.',
      invalidUrl: 'The entered URL format is invalid.',
      corsError: 'Target server refused cross-origin request.'
    }
  }
};