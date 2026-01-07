// Main Application Orchestrator

import parser from './parser.js';
import WhatsAppAnalytics from './analytics.js';
import ChartBuilder from './visualizations.js';
import { formatters, formatNumber, exportUtils } from './utils.js';

class WhatsAppAnalyzerApp {
    constructor() {
        this.parsedData = null;
        this.analytics = null;
        this.chartBuilder = new ChartBuilder();
        this.charts = {};

        this.initializeEventListeners();
        this.initialize3DEffects();
    }

    initialize3DEffects() {
        // Initialize Tilt on existing elements
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(document.querySelectorAll(".glass-card"), {
                max: 5,
                speed: 400,
                glare: true,
                "max-glare": 0.2,
                scale: 1.01
            });
        }
    }

    initializeEventListeners() {
        // File upload
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput?.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processFile(files[0]);
                    // Reset input so same file can be uploaded again
                    if (fileInput) fileInput.value = '';
                }
            });
        }

        // Export functionality
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAnalytics());
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file);
            // RESET value so the same file fails can be retried or same file can be uploaded again if needed
            event.target.value = '';
        }
    }

    async processFile(file) {
        // Validate file type
        if (!file.name.endsWith('.txt')) {
            this.showError('Please upload a .txt file (WhatsApp chat export)');
            return;
        }

        // Show loading state
        this.showLoading();

        // Destroy old charts to prevent memory leaks and growth
        this.destroyAllCharts();

        try {
            // Read file
            const text = await file.text();

            // Parse chat
            this.parsedData = parser.parse(text);

            // Validate parsed data
            if (!this.parsedData.messages || this.parsedData.messages.length === 0) {
                throw new Error('No messages found in the file. Please check the file format.');
            }

            // Create analytics
            this.analytics = new WhatsAppAnalytics(this.parsedData);

            // Render all analytics
            this.renderAnalytics();

            // Hide upload section, show results
            // Use querySelector to be safe if IDs are dynamic, but ID dropZone is correct
            const dropZone = document.getElementById('dropZone');
            const results = document.getElementById('resultsSection');

            if (dropZone) dropZone.classList.add('hidden');
            if (results) results.classList.remove('hidden');

            console.log('Analysis Complete');

        } catch (error) {
            console.error('Processing error:', error);
            this.showError(`Error processing file: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    renderAnalytics() {
        const summary = this.analytics.getComprehensiveSummary();

        // Render overview cards
        this.renderOverview(summary.overview);

        // Render messaging patterns
        this.renderMessagingPatterns(summary.messagingPatterns);

        // Render content analysis
        this.renderContentAnalysis(summary.contentAnalysis);

        // Render temporal patterns
        this.renderTemporalPatterns(summary.temporalPatterns);

        // Render engagement metrics
        this.renderEngagementMetrics(summary.engagementMetrics);

        // Re-initialize Tilt for new dynamic elements
        if (typeof VanillaTilt !== 'undefined') {
            setTimeout(() => {
                VanillaTilt.init(document.querySelectorAll(".stat-card, .chart-card, .glass-card"), {
                    max: 5,
                    speed: 400,
                    glare: true,
                    "max-glare": 0.2,
                    scale: 1.02
                });
            }, 100);
        }
    }

    renderOverview(overview) {
        // Update stat cards
        this.updateStatCard('totalMessages', overview.userMessages);
        this.updateStatCard('totalDays', overview.dateRange.durationDays);
        this.updateStatCard('avgMessagesPerDay', Math.round(overview.averageMessagesPerDay));
        this.updateStatCard('participants', overview.participants.length);

        // Update chat title with participant names
        const chatTitleEl = document.getElementById('chatTitle');
        if (chatTitleEl && overview.participants.length > 0) {
            const participants = overview.participants;
            let title = '';
            if (participants.length === 1) {
                title = participants[0];
            } else if (participants.length === 2) {
                title = `${participants[0]} & ${participants[1]}`;
            } else {
                // A, B, C & D format
                title = participants.slice(0, -1).join(', ') + ' & ' + participants[participants.length - 1];
            }
            chatTitleEl.textContent = title;
        }

        // Update date range
        const dateRangeEl = document.getElementById('dateRange');
        if (dateRangeEl) {
            dateRangeEl.textContent = `${formatters.formatDate(overview.dateRange.start)} - ${formatters.formatDate(overview.dateRange.end)}`;
        }
    }

    renderMessagingPatterns(patterns) {
        // Response times
        const avgResponseTime = document.getElementById('avgResponseTime');
        if (avgResponseTime) {
            avgResponseTime.textContent = formatters.formatDuration(patterns.responseTime.overall.average);
        }

        // Message counts by participant
        const ctx = document.getElementById('messageCountChart');
        if (ctx) {
            this.charts.messageCount = this.chartBuilder.createMessageCountPie(
                ctx,
                this.parsedData.participants,
                patterns.messageCountByParticipant.counts
            );
        }

        // Response time distribution
        const rtCtx = document.getElementById('responseTimeChart');
        if (rtCtx) {
            this.charts.responseTime = this.chartBuilder.createResponseTimeChart(
                rtCtx,
                patterns.responseTime.distribution
            );
        }

        // Conversation initiators
        this.renderConversationInitiators(patterns.conversationInitiators);
    }

    renderContentAnalysis(content) {
        // Top words chart
        const wordsCtx = document.getElementById('topWordsChart');
        if (wordsCtx && content.wordFrequency.overall.length > 0) {
            this.charts.topWords = this.chartBuilder.createTopWordsChart(
                wordsCtx,
                content.wordFrequency.overall.slice(0, 15)
            );
        }

        // Top emojis
        const emojiCtx = document.getElementById('topEmojisChart');
        if (emojiCtx && content.emojiAnalysis.overall.length > 0) {
            this.charts.topEmojis = this.chartBuilder.createEmojiChart(
                emojiCtx,
                content.emojiAnalysis.overall.slice(0, 10)
            );
        }

        // Message length stats
        this.renderMessageLengthStats(content.messageLengthStats);

        // Punctuation analysis
        this.renderPunctuationAnalysis(content.punctuationAnalysis);
    }

    renderTemporalPatterns(temporal) {
        // Hourly activity heatmap
        const hourlyCtx = document.getElementById('hourlyActivityChart');
        if (hourlyCtx) {
            this.charts.hourlyActivity = this.chartBuilder.createHourlyHeatmap(
                hourlyCtx,
                temporal.hourlyActivity.overall
            );
        }

        // Daily activity
        const dailyCtx = document.getElementById('dailyActivityChart');
        if (dailyCtx) {
            this.charts.dailyActivity = this.chartBuilder.createDayOfWeekChart(
                dailyCtx,
                temporal.dailyActivity.overall,
                temporal.dailyActivity.dayNames
            );
        }

        // Monthly trends
        const monthlyCtx = document.getElementById('monthlyTrendChart');
        if (monthlyCtx && temporal.monthlyTrends.length > 0) {
            this.charts.monthlyTrend = this.chartBuilder.createMonthlyTrendChart(
                monthlyCtx,
                temporal.monthlyTrends
            );
        }

        // Peak activity times
        this.renderPeakTimes(temporal.peakActivityTimes);

        // Activity personas
        this.renderActivityPersonas(temporal.activityPersona);
    }

    renderEngagementMetrics(engagement) {
        // Media sharing
        const mediaCtx = document.getElementById('mediaSharingChart');
        if (mediaCtx && engagement.mediaSharingFrequency.overall.total > 0) {
            this.charts.mediaSharing = this.chartBuilder.createMediaSharingChart(
                mediaCtx,
                engagement.mediaSharingFrequency.overall
            );
        }

        // Conversation gaps
        this.renderConversationGaps(engagement.conversationGaps);

        // Conversation streaks
        this.renderConversationStreaks(engagement.conversationStreaks);
    }

    // Helper rendering methods
    updateStatCard(id, value) {
        const el = document.getElementById(id);
        if (el) {
            this.animateCounter(el, 0, value, 1000);
        }
    }

    animateCounter(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = formatNumber(Math.round(current));
        }, 16);
    }

    renderConversationInitiators(initiators) {
        const ctx = document.getElementById('initiationChart');
        if (ctx && initiators) {
            this.charts.initiation = this.chartBuilder.createInitiatorsChart(ctx, initiators);
        }
    }

    renderMessageLengthStats(stats) {
        const ctx = document.getElementById('messageLengthChart');
        if (ctx && stats.byParticipant) {
            this.charts.messageLength = this.chartBuilder.createMessageLengthChart(
                ctx,
                stats.byParticipant
            );
        }
    }

    renderPunctuationAnalysis(analysis) {
        const container = document.getElementById('punctuationAnalysis');
        if (!container) return;

        const html = Object.entries(analysis)
            .map(([person, data]) => `
        <div class="punctuation-row">
          <strong>${person}</strong>
          <div class="punctuation-stats">
            <span class="badge">❓ ${data.questions} questions</span>
            <span class="badge">❗ ${data.exclamations} exclamations</span>
          </div>
        </div>
      `)
            .join('');

        container.innerHTML = html;
    }

    renderPeakTimes(peakTimes) {
        const hourEl = document.getElementById('peakHour');
        const dayEl = document.getElementById('peakDay');

        if (hourEl) {
            hourEl.textContent = peakTimes.peakHour.timeRange;
        }
        if (dayEl) {
            dayEl.textContent = peakTimes.peakDay.day;
        }
    }

    renderActivityPersonas(personas) {
        const container = document.getElementById('activityPersonas');
        if (!container) return;

        const timeEmojis = {
            night: '🌙',
            morning: '🌅',
            afternoon: '☀️',
            evening: '🌆'
        };

        const timeColors = {
            night: '#bd00ff', // Purple
            morning: '#ff9500', // Orange
            afternoon: '#ffcc00', // Yellow
            evening: '#00f3ff'  // Cyan
        };

        const html = Object.entries(personas)
            .map(([person, data]) => {
                const timeSlots = [
                    { label: 'Night', value: data.night, key: 'night' },
                    { label: 'Morning', value: data.morning, key: 'morning' },
                    { label: 'Afternoon', value: data.afternoon, key: 'afternoon' },
                    { label: 'Evening', value: data.evening, key: 'evening' }
                ];

                const barsHTML = timeSlots.map(slot => `
                    <div class="time-slot-bar">
                        <div class="time-slot-label">
                            <span class="time-emoji">${timeEmojis[slot.key]}</span>
                            <span>${slot.label}</span>
                            <span class="time-percent">${slot.value}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${slot.value}%; background: linear-gradient(90deg, ${timeColors[slot.key]}, transparent); box-shadow: 0 0 10px ${timeColors[slot.key]};"></div>
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="persona-card">
                        <div class="persona-name">${person}</div>
                        <div class="persona-type">${data.primaryPersona}</div>
                        <div class="persona-breakdown">
                            ${barsHTML}
                        </div>
                    </div>
                `;
            })
            .join('');

        container.innerHTML = html;
    }

    renderConversationGaps(gaps) {
        const container = document.getElementById('conversationGaps');
        if (!container || !gaps.longestGap) return;

        const html = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h4 style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Longest Silence</h4>
        <div style="font-size: 2.5rem; font-weight: 800; color: var(--accent-danger); margin: 0.5rem 0;">
          ${formatters.formatDuration(gaps.longestGap.duration)}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-secondary); background: var(--bg-primary); padding: 0.5rem; border-radius: 0.5rem; display: inline-block;">
          📅 ${formatters.formatDate(gaps.longestGap.start)} ➡️ ${formatters.formatDate(gaps.longestGap.end)}
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <div style="text-align: center;">
          <div style="color: var(--text-muted); font-size: 0.8rem;">Average Gap</div>
          <div style="font-size: 1.2rem; font-weight: 600;">${formatters.formatDuration(gaps.averageGap)}</div>
        </div>
        <div style="text-align: center;">
          <div style="color: var(--text-muted); font-size: 0.8rem;">Total Gaps (>6h)</div>
          <div style="font-size: 1.2rem; font-weight: 600;">${gaps.count}</div>
        </div>
      </div>
    `;

        container.innerHTML = html;
    }

    renderConversationStreaks(streaks) {
        const ctx = document.getElementById('streaksChart');
        if (ctx && streaks) {
            this.charts.streaks = this.chartBuilder.createStreaksChart(ctx, streaks);
        }
    }

    destroyAllCharts() {
        // Destroy all existing charts to prevent memory leaks
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    exportAnalytics() {
        if (!this.analytics) return;

        const summary = this.analytics.getComprehensiveSummary();
        exportUtils.toJSON(summary, 'whatsapp-analysis.json');
    }

    showLoading() {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.remove('hidden');
    }

    hideLoading() {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            setTimeout(() => errorEl.classList.add('hidden'), 5000);
        } else {
            alert(message);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WhatsAppAnalyzerApp();
});

export default WhatsAppAnalyzerApp;
