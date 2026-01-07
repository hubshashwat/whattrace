// Utility Functions for WhatsApp Chat Analyzer

// Statistical Functions
export const stats = {
  mean: (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,

  median: (arr) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  mode: (arr) => {
    if (!arr.length) return null;
    const freq = {};
    let maxFreq = 0;
    let mode = null;

    arr.forEach(val => {
      freq[val] = (freq[val] || 0) + 1;
      if (freq[val] > maxFreq) {
        maxFreq = freq[val];
        mode = val;
      }
    });

    return mode;
  },

  percentile: (arr, p) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  },

  standardDeviation: (arr) => {
    if (!arr.length) return 0;
    const mean = stats.mean(arr);
    const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
    const variance = stats.mean(squaredDiffs);
    return Math.sqrt(variance);
  }
};

// Date/Time Formatting
export const formatters = {
  timeAgo: (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  },

  formatDuration: (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  },

  formatTime: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  },

  formatDateTime: (date) => {
    return `${formatters.formatDate(date)} ${formatters.formatTime(date)}`;
  }
};

// Stopwords for word frequency analysis
export const STOPWORDS = new Set([
  // English common words
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'i', 'you', 'me', 'my', 'we', 'us',
  'am', 'been', 'being', 'have', 'do', 'does', 'did', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up',
  'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
  'just', 'should', 'now', 'im', 'youre', 'hes', 'shes', 'dont', 'doesnt',
  'didnt', 'isnt', 'arent', 'wasnt', 'werent', 'wont', 'cant', 'yeah',
  'ok', 'okay', 'like', 'oh', 'um', 'uh', 'ya', 'your', 'this', 'what',
  'also', 'get', 'got', 'going', 'go', 'know', 'think', 'want', 'see',
  // Hindi/Hinglish common words
  'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'se', 'ne', 'mein', 'par',
  'kya', 'tha', 'thi', 'the', 'ho', 'hoti', 'wala', 'wali', 'bhi',
  'nahi', 'toh', 'aur', 'koi', 'ek', 'kuch', 'sab', 'yeh', 'woh',
  // WhatsApp specific
  'deleted', 'this', 'message', 'omitted', 'image', 'video', 'sticker',
  'gif', 'audio', 'document', 'contact', 'location', 'missed', 'voice', 'call'
]);

// Emoji Utilities
export const emojiUtils = {
  // Regex to match emojis (Unicode ranges)
  emojiRegex: /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g,

  extractEmojis: (text) => {
    const matches = text.match(emojiUtils.emojiRegex);
    return matches || [];
  },

  countEmojis: (text) => {
    return emojiUtils.extractEmojis(text).length;
  },

  getEmojiFrequency: (messages) => {
    const frequency = {};
    messages.forEach(msg => {
      const emojis = emojiUtils.extractEmojis(msg.content);
      emojis.forEach(emoji => {
        frequency[emoji] = (frequency[emoji] || 0) + 1;
      });
    });
    return frequency;
  },

  getTopEmojis: (messages, limit = 10) => {
    const frequency = emojiUtils.getEmojiFrequency(messages);
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([emoji, count]) => ({ emoji, count }));
  }
};

// Text Analysis Utilities
export const textUtils = {
  removeStopwords: (words) => {
    return words.filter(word => !STOPWORDS.has(word));
  },

  tokenize: (text) => {
    // Remove URLs, mentions, emojis, and special chars, then split
    return text
      .toLowerCase()
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(emojiUtils.emojiRegex, '') // Remove emojis
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .split(/\s+/)
      .filter(word => word.length > 2); // Keep words longer than 2 chars
  },

  getWordFrequency: (messages, removeStopwords = true) => {
    const frequency = {};
    // Media-related words to exclude
    const mediaWords = new Set(['media', 'omitted', 'image', 'video', 'audio', 'sticker', 'gif', 'document', 'deleted']);

    messages.forEach(msg => {
      let words = textUtils.tokenize(msg.content);
      if (removeStopwords) {
        words = textUtils.removeStopwords(words);
      }
      words.forEach(word => {
        // Filter out media-related words
        if (!mediaWords.has(word.toLowerCase())) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });
    });
    return frequency;
  },

  getTopWords: (messages, limit = 20, removeStopwords = true) => {
    const frequency = textUtils.getWordFrequency(messages, removeStopwords);
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  },

  countQuestions: (text) => {
    return (text.match(/\?/g) || []).length;
  },

  countExclamations: (text) => {
    return (text.match(/!/g) || []).length;
  },

  hasCapsLock: (text) => {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 3) return false;
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    return upperCount / letters.length > 0.7; // 70% uppercase
  }
};

// Data Export Utilities
export const exportUtils = {
  toJSON: (data, filename = 'whatsapp-analysis.json') => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  toCSV: (data, filename = 'whatsapp-analysis.csv') => {
    // For array of objects
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Number Formatting
export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Color generation for charts
export const generateColors = (count) => {
  const hueStep = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const hue = i * hueStep;
    return `hsl(${hue}, 70%, 60%)`;
  });
};
