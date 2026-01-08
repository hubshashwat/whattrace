// WhatsApp Chat Parser for Android .txt Format

export class WhatsAppParser {
    constructor() {
        // Support both Android and iPhone formats:
        // Android: DD/MM/YYYY, HH:MM - Sender: Message
        // iPhone: [DD/MM/YYYY, HH:MM:SS AM/PM] Sender: Message

        // Combined pattern for both formats
        this.messagePattern = /^(?:\[)?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)(?:\])?\s*[-–]?\s*([^:]+?):\s*(.*)$/;
        this.systemMessagePattern = /^(?:\[)?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)(?:\])?\s*[-–]?\s*(.*)$/;
    }

    /**
     * Parse WhatsApp chat export file
     * @param {string} fileContent - Raw text content of the chat export
     * @returns {Object} Parsed chat data with messages and metadata
     */
    parse(fileContent) {
        const lines = fileContent.split('\n');
        const messages = [];
        const participants = new Set();
        let currentMessage = null;

        // Detect date format first
        this.dateFormat = this.detectDateFormat(lines);
        console.log('Detected date format:', this.dateFormat);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Try to match as a new message
            const messageMatch = line.match(this.messagePattern);

            if (messageMatch) {
                // Save previous message if exists
                if (currentMessage) {
                    messages.push(this.processMessage(currentMessage));
                    if (currentMessage.sender !== 'SYSTEM') {
                        participants.add(currentMessage.sender);
                    }
                }

                // Start new message
                const [, date, time, sender, content] = messageMatch;
                currentMessage = {
                    date,
                    time,
                    sender: sender.trim(),
                    content: content.trim(),
                    rawLine: line
                };
            } else {
                // Check if it's a system message
                const systemMatch = line.match(this.systemMessagePattern);

                if (systemMatch && !systemMatch[3].includes(':')) {
                    // Save previous message if exists
                    if (currentMessage) {
                        messages.push(this.processMessage(currentMessage));
                        if (currentMessage.sender !== 'SYSTEM') {
                            participants.add(currentMessage.sender);
                        }
                    }

                    const [, date, time, content] = systemMatch;
                    currentMessage = {
                        date,
                        time,
                        sender: 'SYSTEM',
                        content: content.trim(),
                        rawLine: line,
                        isSystem: true
                    };
                } else if (currentMessage) {
                    // This is a continuation of the previous message (multi-line)
                    currentMessage.content += '\n' + line;
                }
            }
        }

        // Don't forget the last message
        if (currentMessage) {
            messages.push(this.processMessage(currentMessage));
            if (currentMessage.sender !== 'SYSTEM') {
                participants.add(currentMessage.sender);
            }
        }

        return {
            messages,
            participants: Array.from(participants),
            totalMessages: messages.length,
            dateRange: this.getDateRange(messages),
            rawContent: fileContent
        };
    }

    /**
     * Detect if date format is DD/MM/YYYY or MM/DD/YYYY
     */
    detectDateFormat(lines) {
        let isMMDD = false;
        let isDDMM = false;

        for (const line of lines) {
            const match = line.match(this.messagePattern) || line.match(this.systemMessagePattern);
            if (match) {
                const [p1, p2] = match[1].split('/').map(Number);
                if (p2 > 12) isMMDD = true; // 12/30 -> p2=30 -> MM/DD
                if (p1 > 12) isDDMM = true; // 30/12 -> p1=30 -> DD/MM
            }
            if (isMMDD || isDDMM) break;
        }

        if (isMMDD && !isDDMM) return 'MM/DD/YYYY';
        if (isDDMM && !isMMDD) return 'DD/MM/YYYY';
        return 'DD/MM/YYYY'; // Default fallback
    }

    /**
     * Process individual message to extract metadata
     */
    processMessage(msg) {
        const timestamp = this.parseTimestamp(msg.date, msg.time);

        return {
            timestamp,
            date: new Date(timestamp),
            sender: msg.sender,
            content: msg.content,
            isSystem: msg.isSystem || false,
            metadata: {
                length: msg.content.length,
                wordCount: msg.content.split(/\s+/).filter(w => w.length > 0).length,
                isMedia: this.isMediaMessage(msg.content),
                isDeleted: this.isDeletedMessage(msg.content),
                hasUrl: this.hasUrl(msg.content),
                hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(msg.content),
                questionCount: (msg.content.match(/\?/g) || []).length,
                exclamationCount: (msg.content.match(/!/g) || []).length,
                mediaType: this.getMediaType(msg.content),
                hour: timestamp.getHours(),
                dayOfWeek: timestamp.getDay(), // 0 = Sunday
                dayOfMonth: timestamp.getDate(),
                month: timestamp.getMonth(),
                year: timestamp.getFullYear()
            }
        };
    }

    /**
     * Parse date and time strings into Date object
     */
    parseTimestamp(dateStr, timeStr) {
        const parts = dateStr.split('/').map(Number);
        let day, month, year;

        if (this.dateFormat === 'MM/DD/YYYY') {
            [month, day, year] = parts;
        } else {
            [day, month, year] = parts;
        }

        const fullYear = year < 100 ? 2000 + year : year;

        // Handle time with or without AM/PM and with or without seconds
        // Supports: HH:MM, HH:MM AM/PM, HH:MM:SS, HH:MM:SS AM/PM
        let hours, minutes, seconds = 0;
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?([AP]M))?/i);

        if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = parseInt(timeMatch[2]);
            seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0; // iPhone includes seconds
            const meridiem = timeMatch[4];

            if (meridiem) {
                // 12-hour format
                if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
        } else {
            [hours, minutes] = timeStr.split(':').map(Number);
        }

        return new Date(fullYear, month - 1, day, hours, minutes, seconds);
    }

    /**
     * Check if message is a media message
     */
    isMediaMessage(content) {
        const mediaPatterns = [
            /image omitted/i,
            /video omitted/i,
            /audio omitted/i,
            /sticker omitted/i,
            /GIF omitted/i,
            /document omitted/i,
            /contact card omitted/i,
            /<attached:/i,
            /\.jpg|\.jpeg|\.png|\.gif|\.mp4|\.pdf|\.doc/i
        ];

        return mediaPatterns.some(pattern => pattern.test(content));
    }

    /**
     * Get media type if it's a media message
     */
    getMediaType(content) {
        if (/image omitted|\.jpg|\.jpeg|\.png/i.test(content)) return 'image';
        if (/video omitted|\.mp4|\.mov/i.test(content)) return 'video';
        if (/audio omitted|\.mp3|voice call/i.test(content)) return 'audio';
        if (/sticker omitted/i.test(content)) return 'sticker';
        if (/GIF omitted|\.gif/i.test(content)) return 'gif';
        if (/document omitted|\.pdf|\.doc/i.test(content)) return 'document';
        if (/contact card omitted/i.test(content)) return 'contact';
        if (/location:/i.test(content)) return 'location';
        return null;
    }

    /**
     * Check if message was deleted
     */
    isDeletedMessage(content) {
        return /this message was deleted|you deleted this message/i.test(content);
    }

    /**
     * Check if message contains URL
     */
    hasUrl(content) {
        return /https?:\/\/[^\s]+/i.test(content);
    }

    /**
     * Get date range of the chat
     */
    getDateRange(messages) {
        if (messages.length === 0) {
            return { start: null, end: null, duration: 0 };
        }

        const dates = messages.map(m => m.timestamp);
        const start = new Date(Math.min(...dates));
        const end = new Date(Math.max(...dates));
        const duration = end - start;

        return {
            start,
            end,
            duration,
            durationDays: Math.floor(duration / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * Get chat statistics summary
     */
    getChatStats(parsedData) {
        const { messages, participants } = parsedData;

        const messagesBySender = {};
        participants.forEach(p => messagesBySender[p] = 0);

        messages.forEach(msg => {
            if (!msg.isSystem) {
                messagesBySender[msg.sender]++;
            }
        });

        return {
            totalMessages: messages.length,
            participants: participants.length,
            messagesBySender,
            dateRange: parsedData.dateRange,
            averageMessagesPerDay: parsedData.dateRange.durationDays > 0
                ? (messages.length / parsedData.dateRange.durationDays).toFixed(2)
                : 0
        };
    }
}

// Export singleton instance
export default new WhatsAppParser();
