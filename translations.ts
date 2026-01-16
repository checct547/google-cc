
export const translations = {
  zh: {
    title: '图像音频视频获取提示',
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
    wordCountLabel: '综合输出字数',
    sections: {
      durationTransitions: '时长与转场点',
      rolesObjects: '角色与物品分类',
      actionTrajectory: '动作位移轨迹',
      artVisualStyle: '艺术与视觉风格',
      dialogueEmotions: '台词与情感标注',
      cinematographyTech: '专业运镜技术',
      physicalEnvironment: '物理环境建模',
      textRecognition: '文字内容识别',
      actionPhysicality: '动作物理过程',
      cameraPathing: '镜头视点轨迹',
      transcription: '语音转录 (SRT)',
      psychologicalAtmosphere: '心理氛围分析',
      audioLayering: '音频分层解析',
      limbMovements: '肢体动作',
      bodyMovements: '躯体动作',
      facialExpressions: '面部表情',
      eyeDetail: '眼睛与眼神细节',
      naturalLanguageSummary: '自然语言综合'
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
    wordCountLabel: 'Summary Length',
    sections: {
      durationTransitions: 'Duration & Transitions',
      rolesObjects: 'Roles & Object Assets',
      actionTrajectory: 'Action Trajectory',
      artVisualStyle: 'Art & Visual Style',
      dialogueEmotions: 'Dialogue & Emotions',
      cinematographyTech: 'Cinematography Tech',
      physicalEnvironment: 'Environment Modeling',
      textRecognition: 'Text Recognition',
      actionPhysicality: 'Action Physicality',
      cameraPathing: 'Camera Pathing',
      transcription: 'Transcription (SRT)',
      psychologicalAtmosphere: 'Atmosphere Analysis',
      audioLayering: 'Audio Layering',
      limbMovements: 'Limb Movements',
      bodyMovements: 'Body Movements',
      facialExpressions: 'Facial Expressions',
      eyeDetail: 'Eye & Gaze Details',
      naturalLanguageSummary: 'Natural Language Synthesis'
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
