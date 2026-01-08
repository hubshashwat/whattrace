// Analytics Engine for WhatsApp Chat Analysis

import { stats, emojiUtils, textUtils } from './utils.js';

export class WhatsAppAnalytics {
    constructor(parsedData) {
        this.messages = parsedData.messages;
        this.participants = parsedData.participants;
        this.dateRange = parsedData.dateRange;

        // Filter out system messages for most analytics
        this.userMessages = this.messages.filter(m => !m.isSystem);
    }

    /**
     * MESSAGING PATTERNS
     */

    getMessagingPatterns() {
        const responseTime = this.calculateResponseTimes();
        return {
            responseTime: responseTime,
            messageFrequency: this.getMessageFrequency(),
            conversationInitiators: this.getConversationInitiators(),
            messageCountByParticipant: this.getMessageCountByParticipant(),
            averageMessagesPerConversation: this.getAverageMessagesPerConversation(),
            bestTimeToMessage: this.getBestTimeToMessage(responseTime.byHourBySender)
        };
    }

    calculateResponseTimes() {
        const responseTimes = [];
        const responseTimesBySender = {};
        const responseTimesByHourBySender = {};

        this.participants.forEach(p => {
            responseTimesBySender[p] = [];
            responseTimesByHourBySender[p] = {};
            for (let h = 0; h < 24; h++) {
                responseTimesByHourBySender[p][h] = [];
            }
        });

        for (let i = 1; i < this.userMessages.length; i++) {
            const currentMsg = this.userMessages[i];
            const previousMsg = this.userMessages[i - 1];

            // Only count if different senders (response, not consecutive messages)
            if (currentMsg.sender !== previousMsg.sender) {
                const timeDiff = currentMsg.timestamp - previousMsg.timestamp;
                responseTimes.push(timeDiff);
                responseTimesBySender[currentMsg.sender].push(timeDiff);

                // Track response time by hour when the message was sent
                const hour = previousMsg.metadata.hour;
                responseTimesByHourBySender[currentMsg.sender][hour].push(timeDiff);
            }
        }

        const averageByParticipant = {};
        const medianByParticipant = {};

        this.participants.forEach(p => {
            const times = responseTimesBySender[p];
            averageByParticipant[p] = times.length ? stats.mean(times) : 0;
            medianByParticipant[p] = times.length ? stats.median(times) : 0;
        });

        return {
            overall: {
                average: stats.mean(responseTimes),
                median: stats.median(responseTimes),
                min: Math.min(...responseTimes),
                max: Math.max(...responseTimes),
                percentile25: stats.percentile(responseTimes, 25),
                percentile75: stats.percentile(responseTimes, 75),
                percentile90: stats.percentile(responseTimes, 90)
            },
            byParticipant: {
                average: averageByParticipant,
                median: medianByParticipant
            },
            distribution: this.getResponseTimeDistribution(responseTimes),
            byHourBySender: responseTimesByHourBySender
        };
    }

    getResponseTimeDistribution(responseTimes) {
        const ranges = {
            'Under 1 min': 0,
            '1-5 min': 0,
            '5-30 min': 0,
            '30 min - 1 hr': 0,
            '1-6 hrs': 0,
            '6-24 hrs': 0,
            'Over 24 hrs': 0
        };

        responseTimes.forEach(time => {
            const minutes = time / (1000 * 60);
            const hours = minutes / 60;

            if (minutes < 1) ranges['Under 1 min']++;
            else if (minutes < 5) ranges['1-5 min']++;
            else if (minutes < 30) ranges['5-30 min']++;
            else if (hours < 1) ranges['30 min - 1 hr']++;
            else if (hours < 6) ranges['1-6 hrs']++;
            else if (hours < 24) ranges['6-24 hrs']++;
            else ranges['Over 24 hrs']++;
        });

        return ranges;
    }

    getMessageFrequency() {
        const byHour = new Array(24).fill(0);
        const byDayOfWeek = new Array(7).fill(0);
        const byMonth = {};
        const byDate = {};

        this.userMessages.forEach(msg => {
            byHour[msg.metadata.hour]++;
            byDayOfWeek[msg.metadata.dayOfWeek]++;

            const monthKey = `${msg.metadata.year}-${String(msg.metadata.month + 1).padStart(2, '0')}`;
            byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;

            const dateKey = msg.date.toISOString().split('T')[0];
            byDate[dateKey] = (byDate[dateKey] || 0) + 1;
        });

        return {
            byHour,
            byDayOfWeek,
            byMonth,
            byDate,
            totalMessages: this.userMessages.length
        };
    }

    getConversationInitiators() {
        const initiators = {};
        this.participants.forEach(p => initiators[p] = 0);

        // A conversation starts after a gap of > 6 hours
        const conversationGap = 6 * 60 * 60 * 1000; // 6 hours in ms

        for (let i = 0; i < this.userMessages.length; i++) {
            const msg = this.userMessages[i];

            if (i === 0) {
                initiators[msg.sender]++;
            } else {
                const prevMsg = this.userMessages[i - 1];
                const timeDiff = msg.timestamp - prevMsg.timestamp;

                if (timeDiff > conversationGap) {
                    initiators[msg.sender]++;
                }
            }
        }

        return initiators;
    }

    getMessageCountByParticipant() {
        const counts = {};
        const percentages = {};

        this.participants.forEach(p => counts[p] = 0);
        this.userMessages.forEach(msg => counts[msg.sender]++);

        const total = this.userMessages.length;
        this.participants.forEach(p => {
            percentages[p] = ((counts[p] / total) * 100).toFixed(1);
        });

        return { counts, percentages };
    }

    getAverageMessagesPerConversation() {
        let conversationCount = 1;
        const conversationGap = 6 * 60 * 60 * 1000;

        for (let i = 1; i < this.userMessages.length; i++) {
            const timeDiff = this.userMessages[i].timestamp - this.userMessages[i - 1].timestamp;
            if (timeDiff > conversationGap) {
                conversationCount++;
            }
        }

        return (this.userMessages.length / conversationCount).toFixed(1);
    }

    getBestTimeToMessage(responseTimesByHourBySender) {
        const bestTimes = {};

        this.participants.forEach(p => {
            const hourlyAverages = {};
            let fastestHour = null;
            let fastestTime = Infinity;

            // Calculate average response time for each hour
            for (let hour = 0; hour < 24; hour++) {
                const times = responseTimesByHourBySender[p][hour];
                if (times && times.length >= 3) { // Require at least 3 responses for reliability
                    const avgTime = stats.mean(times);
                    hourlyAverages[hour] = {
                        average: avgTime,
                        count: times.length
                    };

                    if (avgTime < fastestTime) {
                        fastestTime = avgTime;
                        fastestHour = hour;
                    }
                }
            }

            // Find top 3 best times
            const sortedHours = Object.entries(hourlyAverages)
                .sort((a, b) => a[1].average - b[1].average)
                .slice(0, 3);

            bestTimes[p] = {
                bestHour: fastestHour,
                bestTime: fastestTime,
                hourlyAverages: hourlyAverages,
                top3Hours: sortedHours.map(([hour, data]) => ({
                    hour: parseInt(hour),
                    timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`,
                    averageResponseTime: data.average,
                    sampleSize: data.count
                }))
            };
        });

        return bestTimes;
    }

    /**
     * CONTENT ANALYSIS
     */

    getContentAnalysis() {
        return {
            wordFrequency: this.getWordFrequency(),
            emojiAnalysis: this.getEmojiAnalysis(),
            messageLengthStats: this.getMessageLengthStats(),
            punctuationAnalysis: this.getPunctuationAnalysis(),
            capsLockUsage: this.getCapsLockUsage()
        };
    }

    getWordFrequency() {
        const overall = textUtils.getTopWords(this.userMessages, 30);
        const byParticipant = {};

        this.participants.forEach(p => {
            const participantMessages = this.userMessages.filter(m => m.sender === p);
            byParticipant[p] = textUtils.getTopWords(participantMessages, 20);
        });

        return { overall, byParticipant };
    }

    getEmojiAnalysis() {
        const overall = emojiUtils.getTopEmojis(this.userMessages, 20);
        const byParticipant = {};
        const totalByParticipant = {};

        this.participants.forEach(p => {
            const participantMessages = this.userMessages.filter(m => m.sender === p);
            byParticipant[p] = emojiUtils.getTopEmojis(participantMessages, 15);
            totalByParticipant[p] = participantMessages.reduce((sum, m) =>
                sum + emojiUtils.countEmojis(m.content), 0);
        });

        return {
            overall,
            byParticipant,
            totalByParticipant
        };
    }

    getMessageLengthStats() {
        const lengths = this.userMessages.map(m => m.metadata.length);
        const wordCounts = this.userMessages.map(m => m.metadata.wordCount);

        const byParticipant = {};
        this.participants.forEach(p => {
            const participantMessages = this.userMessages.filter(m => m.sender === p);
            const participantLengths = participantMessages.map(m => m.metadata.length);
            const participantWordCounts = participantMessages.map(m => m.metadata.wordCount);

            byParticipant[p] = {
                averageLength: stats.mean(participantLengths),
                medianLength: stats.median(participantLengths),
                averageWords: stats.mean(participantWordCounts)
            };
        });

        return {
            overall: {
                averageLength: stats.mean(lengths),
                medianLength: stats.median(lengths),
                averageWords: stats.mean(wordCounts),
                stdDeviation: stats.standardDeviation(lengths)
            },
            byParticipant
        };
    }

    getPunctuationAnalysis() {
        const analysis = {};

        this.participants.forEach(p => {
            const participantMessages = this.userMessages.filter(m => m.sender === p);
            const questions = participantMessages.reduce((sum, m) => sum + m.metadata.questionCount, 0);
            const exclamations = participantMessages.reduce((sum, m) => sum + m.metadata.exclamationCount, 0);

            analysis[p] = {
                questions,
                exclamations,
                questionsPerMessage: (questions / participantMessages.length).toFixed(2),
                exclamationsPerMessage: (exclamations / participantMessages.length).toFixed(2)
            };
        });

        return analysis;
    }

    getCapsLockUsage() {
        const usage = {};

        this.participants.forEach(p => {
            const participantMessages = this.userMessages.filter(m => m.sender === p);
            const capsMessages = participantMessages.filter(m => textUtils.hasCapsLock(m.content));

            usage[p] = {
                count: capsMessages.length,
                percentage: ((capsMessages.length / participantMessages.length) * 100).toFixed(1)
            };
        });

        return usage;
    }

    /**
     * TEMPORAL PATTERNS
     */

    getTemporalPatterns() {
        return {
            hourlyActivity: this.getHourlyActivity(),
            dailyActivity: this.getDailyActivity(),
            monthlyTrends: this.getMonthlyTrends(),
            peakActivityTimes: this.getPeakActivityTimes(),
            activityPersona: this.getActivityPersona()
        };
    }

    getHourlyActivity() {
        const byHour = new Array(24).fill(0);
        const byHourByParticipant = {};

        this.participants.forEach(p => {
            byHourByParticipant[p] = new Array(24).fill(0);
        });

        this.userMessages.forEach(msg => {
            byHour[msg.metadata.hour]++;
            byHourByParticipant[msg.sender][msg.metadata.hour]++;
        });

        return { overall: byHour, byParticipant: byHourByParticipant };
    }

    getDailyActivity() {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const byDay = new Array(7).fill(0);
        const byDayByParticipant = {};

        this.participants.forEach(p => {
            byDayByParticipant[p] = new Array(7).fill(0);
        });

        this.userMessages.forEach(msg => {
            byDay[msg.metadata.dayOfWeek]++;
            byDayByParticipant[msg.sender][msg.metadata.dayOfWeek]++;
        });

        return {
            overall: byDay,
            byParticipant: byDayByParticipant,
            dayNames
        };
    }

    getMonthlyTrends() {
        const byMonth = {};

        this.userMessages.forEach(msg => {
            const monthKey = `${msg.metadata.year}-${String(msg.metadata.month + 1).padStart(2, '0')}`;
            byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
        });

        return Object.entries(byMonth)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => ({ month, count }));
    }

    getPeakActivityTimes() {
        const hourlyActivity = this.getHourlyActivity().overall;
        const dailyActivity = this.getDailyActivity().overall;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
        const peakDay = dailyActivity.indexOf(Math.max(...dailyActivity));

        return {
            peakHour: {
                hour: peakHour,
                messageCount: hourlyActivity[peakHour],
                timeRange: `${peakHour}:00 - ${peakHour + 1}:00`
            },
            peakDay: {
                day: dayNames[peakDay],
                messageCount: dailyActivity[peakDay]
            }
        };
    }

    getActivityPersona() {
        const personas = {};

        this.participants.forEach(p => {
            const messages = this.userMessages.filter(m => m.sender === p);
            const hours = messages.map(m => m.metadata.hour);

            const nightMessages = hours.filter(h => h >= 0 && h < 6).length;
            const morningMessages = hours.filter(h => h >= 6 && h < 12).length;
            const afternoonMessages = hours.filter(h => h >= 12 && h < 18).length;
            const eveningMessages = hours.filter(h => h >= 18 && h < 24).length;

            const total = messages.length;

            personas[p] = {
                night: ((nightMessages / total) * 100).toFixed(1),
                morning: ((morningMessages / total) * 100).toFixed(1),
                afternoon: ((afternoonMessages / total) * 100).toFixed(1),
                evening: ((eveningMessages / total) * 100).toFixed(1),
                primaryPersona: this.determinePrimaryPersona(nightMessages, morningMessages, afternoonMessages, eveningMessages)
            };
        });

        return personas;
    }

    determinePrimaryPersona(night, morning, afternoon, evening) {
        const max = Math.max(night, morning, afternoon, evening);
        if (max === night) return '🌙 Night Owl';
        if (max === morning) return '🌅 Early Bird';
        if (max === afternoon) return '☀️ Afternoon Active';
        return '🌆 Evening Chatter';
    }

    /**
     * ENGAGEMENT METRICS
     */

    getEngagementMetrics() {
        return {
            mediaSharingFrequency: this.getMediaSharingFrequency(),
            deletedMessagePatterns: this.getDeletedMessagePatterns(),
            conversationGaps: this.getConversationGaps(),
            conversationStreaks: this.getConversationStreaks(),
            urlSharingStats: this.getUrlSharingStats(),
            doubleTextingPatterns: this.getDoubleTextingPatterns(),
            ghostPeriods: this.getGhostPeriods(),
            conversationEnders: this.getConversationEnders()
        };
    }

    getMediaSharingFrequency() {
        const overall = {
            total: 0,
            byType: {}
        };

        const byParticipant = {};
        this.participants.forEach(p => {
            byParticipant[p] = { total: 0, byType: {} };
        });

        this.userMessages.forEach(msg => {
            if (msg.metadata.isMedia) {
                overall.total++;
                const mediaType = msg.metadata.mediaType || 'unknown';
                overall.byType[mediaType] = (overall.byType[mediaType] || 0) + 1;

                byParticipant[msg.sender].total++;
                byParticipant[msg.sender].byType[mediaType] =
                    (byParticipant[msg.sender].byType[mediaType] || 0) + 1;
            }
        });

        return { overall, byParticipant };
    }

    getDeletedMessagePatterns() {
        const patterns = {};

        this.participants.forEach(p => {
            const messages = this.userMessages.filter(m => m.sender === p);
            const deletedMessages = messages.filter(m => m.metadata.isDeleted);

            patterns[p] = {
                count: deletedMessages.length,
                percentage: ((deletedMessages.length / messages.length) * 100).toFixed(1)
            };
        });

        return patterns;
    }

    getConversationGaps() {
        const gaps = [];
        const conversationGapThreshold = 6 * 60 * 60 * 1000; // 6 hours

        for (let i = 1; i < this.userMessages.length; i++) {
            const gap = this.userMessages[i].timestamp - this.userMessages[i - 1].timestamp;
            if (gap > conversationGapThreshold) {
                gaps.push({
                    duration: gap,
                    start: this.userMessages[i - 1].date,
                    end: this.userMessages[i].date
                });
            }
        }

        gaps.sort((a, b) => b.duration - a.duration);

        return {
            count: gaps.length,
            longestGap: gaps[0] || null,
            averageGap: gaps.length ? stats.mean(gaps.map(g => g.duration)) : 0,
            top10Gaps: gaps.slice(0, 10)
        };
    }

    getConversationStreaks() {
        const streaks = [];
        let currentStreak = { days: [], messageCount: 0 };

        const messagesByDate = {};
        this.userMessages.forEach(msg => {
            const dateKey = msg.date.toISOString().split('T')[0];
            messagesByDate[dateKey] = (messagesByDate[dateKey] || 0) + 1;
        });

        const sortedDates = Object.keys(messagesByDate).sort();

        for (let i = 0; i < sortedDates.length; i++) {
            const date = sortedDates[i];
            currentStreak.days.push(date);
            currentStreak.messageCount += messagesByDate[date];

            // Check if next day is consecutive
            if (i < sortedDates.length - 1) {
                const currentDate = new Date(date);
                const nextDate = new Date(sortedDates[i + 1]);
                const dayDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);

                if (dayDiff > 1) {
                    // Streak ended
                    if (currentStreak.days.length > 1) {
                        streaks.push({ ...currentStreak });
                    }
                    currentStreak = { days: [], messageCount: 0 };
                }
            }
        }

        // Don't forget the last streak
        if (currentStreak.days.length > 1) {
            streaks.push(currentStreak);
        }

        streaks.sort((a, b) => b.days.length - a.days.length);

        return {
            longestStreak: streaks[0] || null,
            totalStreaks: streaks.length,
            top5Streaks: streaks.slice(0, 5)
        };
    }

    getUrlSharingStats() {
        const stats = {};

        this.participants.forEach(p => {
            const messages = this.userMessages.filter(m => m.sender === p);
            const urlMessages = messages.filter(m => m.metadata.hasUrl);

            stats[p] = {
                count: urlMessages.length,
                percentage: ((urlMessages.length / messages.length) * 100).toFixed(1)
            };
        });

        return stats;
    }

    /**
     * CONVERSATION DYNAMICS
     */

    getDoubleTextingPatterns() {
        const patterns = {};

        this.participants.forEach(p => {
            patterns[p] = {
                doubleTexts: 0,
                tripleTexts: 0,
                quadPlusTexts: 0,
                longestStreak: 0,
                totalConsecutiveMessages: 0
            };
        });

        let currentSender = null;
        let consecutiveCount = 0;

        this.userMessages.forEach((msg, index) => {
            if (msg.sender === currentSender) {
                consecutiveCount++;
            } else {
                // Record the previous streak
                if (currentSender && consecutiveCount > 1) {
                    patterns[currentSender].totalConsecutiveMessages += consecutiveCount;

                    if (consecutiveCount === 2) patterns[currentSender].doubleTexts++;
                    else if (consecutiveCount === 3) patterns[currentSender].tripleTexts++;
                    else if (consecutiveCount >= 4) patterns[currentSender].quadPlusTexts++;

                    if (consecutiveCount > patterns[currentSender].longestStreak) {
                        patterns[currentSender].longestStreak = consecutiveCount;
                    }
                }

                // Start new streak
                currentSender = msg.sender;
                consecutiveCount = 1;
            }
        });

        // Don't forget the last streak
        if (currentSender && consecutiveCount > 1) {
            patterns[currentSender].totalConsecutiveMessages += consecutiveCount;

            if (consecutiveCount === 2) patterns[currentSender].doubleTexts++;
            else if (consecutiveCount === 3) patterns[currentSender].tripleTexts++;
            else if (consecutiveCount >= 4) patterns[currentSender].quadPlusTexts++;

            if (consecutiveCount > patterns[currentSender].longestStreak) {
                patterns[currentSender].longestStreak = consecutiveCount;
            }
        }

        // Calculate percentages
        this.participants.forEach(p => {
            const totalMessages = this.userMessages.filter(m => m.sender === p).length;
            patterns[p].percentage = ((patterns[p].totalConsecutiveMessages / totalMessages) * 100).toFixed(1);
            patterns[p].totalInstances = patterns[p].doubleTexts + patterns[p].tripleTexts + patterns[p].quadPlusTexts;
        });

        return patterns;
    }

    getGhostPeriods() {
        const ghostPeriods = {};
        const ghostThreshold = 24 * 60 * 60 * 1000; // 24 hours

        this.participants.forEach(p => {
            ghostPeriods[p] = {
                totalGhosts: 0,
                longestGhost: 0,
                averageGhostDuration: 0,
                ghostInstances: []
            };
        });

        for (let i = 1; i < this.userMessages.length; i++) {
            const currentMsg = this.userMessages[i];
            const previousMsg = this.userMessages[i - 1];

            // Check if different senders (someone is waiting for a response)
            if (currentMsg.sender !== previousMsg.sender) {
                const timeDiff = currentMsg.timestamp - previousMsg.timestamp;

                // If response took more than 24 hours, it's a ghost
                if (timeDiff > ghostThreshold) {
                    const ghoster = currentMsg.sender; // Person who finally responded

                    ghostPeriods[ghoster].totalGhosts++;
                    ghostPeriods[ghoster].ghostInstances.push({
                        duration: timeDiff,
                        startDate: previousMsg.date,
                        endDate: currentMsg.date
                    });

                    if (timeDiff > ghostPeriods[ghoster].longestGhost) {
                        ghostPeriods[ghoster].longestGhost = timeDiff;
                    }
                }
            }
        }

        // Calculate averages and sort instances
        this.participants.forEach(p => {
            if (ghostPeriods[p].totalGhosts > 0) {
                const totalDuration = ghostPeriods[p].ghostInstances.reduce((sum, g) => sum + g.duration, 0);
                ghostPeriods[p].averageGhostDuration = totalDuration / ghostPeriods[p].totalGhosts;

                // Sort by duration (longest first) and keep top 5
                ghostPeriods[p].ghostInstances.sort((a, b) => b.duration - a.duration);
                ghostPeriods[p].top5Ghosts = ghostPeriods[p].ghostInstances.slice(0, 5);
            }
        });

        return ghostPeriods;
    }

    getConversationEnders() {
        const enders = {};
        const conversationGap = 6 * 60 * 60 * 1000; // 6 hours defines conversation end

        this.participants.forEach(p => {
            enders[p] = {
                count: 0,
                percentage: 0
            };
        });

        let totalConversationEnds = 0;

        for (let i = 0; i < this.userMessages.length - 1; i++) {
            const currentMsg = this.userMessages[i];
            const nextMsg = this.userMessages[i + 1];

            const timeDiff = nextMsg.timestamp - currentMsg.timestamp;

            // If gap is more than 6 hours, current message ended the conversation
            if (timeDiff > conversationGap) {
                enders[currentMsg.sender].count++;
                totalConversationEnds++;
            }
        }

        // The last message in the chat also ends a conversation
        if (this.userMessages.length > 0) {
            const lastMsg = this.userMessages[this.userMessages.length - 1];
            enders[lastMsg.sender].count++;
            totalConversationEnds++;
        }

        // Calculate percentages
        this.participants.forEach(p => {
            if (totalConversationEnds > 0) {
                enders[p].percentage = ((enders[p].count / totalConversationEnds) * 100).toFixed(1);
            }
        });

        return {
            byParticipant: enders,
            totalConversations: totalConversationEnds
        };
    }

    /**
     * COMPREHENSIVE SUMMARY
     */

    getComprehensiveSummary() {
        return {
            overview: {
                totalMessages: this.messages.length,
                userMessages: this.userMessages.length,
                participants: this.participants,
                dateRange: this.dateRange,
                averageMessagesPerDay: (this.userMessages.length / this.dateRange.durationDays).toFixed(1)
            },
            messagingPatterns: this.getMessagingPatterns(),
            contentAnalysis: this.getContentAnalysis(),
            temporalPatterns: this.getTemporalPatterns(),
            engagementMetrics: this.getEngagementMetrics()
        };
    }
}

export default WhatsAppAnalytics;
