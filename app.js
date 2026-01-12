// Main Application Orchestrator

import parser from './parser.js';
import WhatsAppAnalytics from './analytics.js';
import ChartBuilder from './visualizations.js';
import { formatters, formatNumber, exportUtils } from './utils.js';

class WhatsAppAnalyzerApp {
    constructor() {
        this.parsedData = null;
        this.originalParsedData = null; // Store original unfiltered data
        this.originalRawText = null; // Store original raw text for re-parsing
        this.analytics = null;
        this.chartBuilder = new ChartBuilder();
        this.charts = {};
        this.dateFilter = {
            startDate: null,
            endDate: null,
            isActive: false
        };

        this.initializePrivacyModal();
        this.initializeEventListeners();
        this.initialize3DEffects();
    }

    initializePrivacyModal() {
        const modal = document.getElementById('privacyModal');
        const acceptBtn = document.getElementById('acceptPrivacy');

        // Check if user has already accepted
        const hasAccepted = localStorage.getItem('privacyAccepted');

        if (!hasAccepted) {
            // Show modal on first visit
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }

        // Handle accept button click
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('privacyAccepted', 'true');
            modal.classList.add('hidden');
        });
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

        // Date filter functionality
        const applyFilterBtn = document.getElementById('applyFilter');
        const resetFilterBtn = document.getElementById('resetFilter');
        
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => this.applyDateFilter());
        }
        
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', () => this.resetDateFilter());
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
        const isTextFile = file.name.endsWith('.txt');
        const isZipFile = file.name.endsWith('.zip');

        if (!isTextFile && !isZipFile) {
            this.showError('Please upload a .txt or .zip file (WhatsApp chat export)');
            return;
        }

        // Show loading state
        this.showLoading();

        // Destroy old charts to prevent memory leaks and growth
        this.destroyAllCharts();

        try {
            let text;

            if (isZipFile) {
                // Handle ZIP file - extract .txt file
                text = await this.extractTextFromZip(file);
            } else {
                // Handle regular .txt file
                text = await file.text();
            }

            // Store original raw text for filtering and re-parsing
            this.originalRawText = text;

            // Parse chat
            this.parsedData = parser.parse(text);
            this.originalParsedData = JSON.parse(JSON.stringify(this.parsedData)); // Deep copy

            // Validate parsed data
            if (!this.parsedData.messages || this.parsedData.messages.length === 0) {
                throw new Error('No messages found in the file. Please check the file format.');
            }

            // Initialize date filter inputs with data range
            this.initializeDateFilterInputs();

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

    async extractTextFromZip(zipFile) {
        // Dynamically import JSZip
        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;

        try {
            const zip = await JSZip.loadAsync(zipFile);

            // Find .txt file in the zip
            let txtFile = null;
            let txtFileName = null;

            zip.forEach((relativePath, file) => {
                if (relativePath.endsWith('.txt') && !file.dir) {
                    txtFile = file;
                    txtFileName = relativePath;
                }
            });

            if (!txtFile) {
                throw new Error('No .txt file found in the ZIP archive. Please ensure your WhatsApp export contains a chat file.');
            }

            console.log(`Found chat file: ${txtFileName}`);

            // Extract and read the text content
            const text = await txtFile.async('text');
            return text;

        } catch (error) {
            if (error.message.includes('No .txt file')) {
                throw error;
            }
            throw new Error('Failed to extract ZIP file. Please ensure it\'s a valid WhatsApp export.');
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

        // Individual response times by participant
        const individualRtCtx = document.getElementById('individualResponseTimeChart');
        if (individualRtCtx) {
            this.charts.individualResponseTime = this.chartBuilder.createIndividualResponseTimeChart(
                individualRtCtx,
                patterns.responseTime.byParticipant
            );
        }

        // Conversation initiators
        this.renderConversationInitiators(patterns.conversationInitiators);

        // Best time to message
        this.renderBestTimeToMessage(patterns.bestTimeToMessage);
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

        // New conversation dynamics
        this.renderDoubleTexting(engagement.doubleTextingPatterns);
        this.renderGhostPeriods(engagement.ghostPeriods);
        this.renderConversationEnders(engagement.conversationEnders);
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

    renderBestTimeToMessage(bestTimes) {
        const container = document.getElementById('bestTimeToMessage');
        if (!container) return;

        const html = Object.entries(bestTimes)
            .map(([person, data]) => {
                if (!data.bestHour && data.top3Hours.length === 0) {
                    return `
                        <div class="best-time-card">
                            <div class="best-time-name">${person}</div>
                            <div class="no-data-message">Insufficient data for analysis</div>
                        </div>
                    `;
                }

                const top3HTML = data.top3Hours.map((slot, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    const responseTime = formatters.formatDuration(slot.averageResponseTime);

                    return `
                        <div class="time-slot-row ${index === 0 ? 'best-slot' : ''}">
                            <div class="slot-rank">${medal}</div>
                            <div class="slot-time">${slot.timeRange}</div>
                            <div class="slot-response">${responseTime}</div>
                            <div class="slot-samples">${slot.sampleSize} samples</div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="best-time-card">
                        <div class="best-time-header">
                            <div class="best-time-name">${person}</div>
                            ${data.bestHour !== null ? `
                                <div class="best-time-badge">
                                    Best: ${data.bestHour}:00 - ${data.bestHour + 1}:00
                                </div>
                            ` : ''}
                        </div>
                        <div class="best-time-slots">
                            ${top3HTML}
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

    renderDoubleTexting(patterns) {
        const container = document.getElementById('doubleTextingAnalysis');
        if (!container) return;

        const html = Object.entries(patterns)
            .map(([person, data]) => {
                const totalInstances = data.totalInstances;

                return `
                    <div class="double-text-card">
                        <div class="dt-header">
                            <span class="dt-name">${person}</span>
                            <span class="dt-badge">${totalInstances} instances</span>
                        </div>
                        <div class="dt-stats">
                            <div class="dt-stat">
                                <span class="dt-label">2x</span>
                                <span class="dt-value">${data.doubleTexts}</span>
                            </div>
                            <div class="dt-stat">
                                <span class="dt-label">3x</span>
                                <span class="dt-value">${data.tripleTexts}</span>
                            </div>
                            <div class="dt-stat">
                                <span class="dt-label">4x+</span>
                                <span class="dt-value">${data.quadPlusTexts}</span>
                            </div>
                            <div class="dt-stat highlight">
                                <span class="dt-label">Max Streak</span>
                                <span class="dt-value">${data.longestStreak}</span>
                            </div>
                        </div>
                        <div class="dt-percentage">
                            ${data.percentage}% of messages are consecutive
                        </div>
                    </div>
                `;
            })
            .join('');

        container.innerHTML = html;
    }

    renderGhostPeriods(ghostPeriods) {
        const container = document.getElementById('ghostPeriodsAnalysis');
        if (!container) return;

        // Check if there's any ghosting data at all
        const hasAnyGhosting = Object.values(ghostPeriods).some(data => data.totalGhosts > 0);

        // If no one has ghosted, hide the entire panel
        if (!hasAnyGhosting) {
            const panel = container.closest('.glass-panel');
            if (panel) {
                panel.style.display = 'none';
            }
            return;
        }

        // Show the panel if it was hidden
        const panel = container.closest('.glass-panel');
        if (panel) {
            panel.style.display = '';
        }

        const html = Object.entries(ghostPeriods)
            .filter(([person, data]) => data.totalGhosts > 0) // Only show participants with ghosting
            .map(([person, data]) => {
                const longestGhostDuration = formatters.formatDuration(data.longestGhost);
                const avgGhostDuration = formatters.formatDuration(data.averageGhostDuration);

                return `
                    <div class="ghost-card">
                        <div class="ghost-header">
                            <span class="ghost-name">${person}</span>
                            <span class="ghost-count">👻 ${data.totalGhosts} ghosts</span>
                        </div>
                        <div class="ghost-metrics">
                            <div class="ghost-metric">
                                <span class="metric-label">Longest Ghost</span>
                                <span class="metric-value danger">${longestGhostDuration}</span>
                            </div>
                            <div class="ghost-metric">
                                <span class="metric-label">Average Ghost</span>
                                <span class="metric-value">${avgGhostDuration}</span>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        container.innerHTML = html;
    }

    renderConversationEnders(endersData) {
        const ctx = document.getElementById('conversationEndersChart');
        if (!ctx) return;

        const participants = Object.keys(endersData.byParticipant);
        const counts = participants.map(p => endersData.byParticipant[p].count);
        const percentages = participants.map(p => endersData.byParticipant[p].percentage);

        this.charts.conversationEnders = this.chartBuilder.createConversationEndersChart(
            ctx,
            participants,
            counts,
            percentages
        );
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

    initializeDateFilterInputs() {
        if (!this.originalParsedData || !this.originalParsedData.messages.length) return;

        const messages = this.originalParsedData.messages;
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];

        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (startDateInput && endDateInput) {
            // Set min and max values to the data range
            const minDate = this.formatDateForInput(firstMessage.timestamp);
            const maxDate = this.formatDateForInput(lastMessage.timestamp);
            
            startDateInput.min = minDate;
            startDateInput.max = maxDate;
            endDateInput.min = minDate;
            endDateInput.max = maxDate;

            // Set default values to full range
            startDateInput.value = minDate;
            endDateInput.value = maxDate;
        }
    }

    formatDateForInput(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    }

    applyDateFilter() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (!startDateInput || !endDateInput || !this.originalParsedData) {
            this.showError('Date filter inputs not found or no data loaded');
            return;
        }

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            this.showError('Please select both start and end dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showError('Start date must be before end date');
            return;
        }

        // Update filter state
        this.dateFilter.startDate = new Date(startDate);
        this.dateFilter.endDate = new Date(endDate + 'T23:59:59'); // Include full end date
        this.dateFilter.isActive = true;

        // Apply filter and re-render
        this.applyFilterToData();
        
        this.showLoading();
        
        // Destroy old charts
        this.destroyAllCharts();
        
        // Re-create analytics with filtered data
        this.analytics = new WhatsAppAnalytics(this.parsedData);
        
        // Re-render everything
        this.renderAnalytics();
        
        this.hideLoading();
        
        console.log(`Applied date filter: ${startDate} to ${endDate}`);
    }

    resetDateFilter() {
        // Reset filter state
        this.dateFilter.startDate = null;
        this.dateFilter.endDate = null;
        this.dateFilter.isActive = false;

        // Restore original data
        this.parsedData = parser.parse(this.originalRawText);
        
        // Reset input values to full range
        this.initializeDateFilterInputs();

        this.showLoading();
        
        // Destroy old charts
        this.destroyAllCharts();
        
        // Re-create analytics with original data
        this.analytics = new WhatsAppAnalytics(this.parsedData);
        
        // Re-render everything
        this.renderAnalytics();
        
        this.hideLoading();
        
        console.log('Reset date filter to show all data');
    }

    applyFilterToData() {
        if (!this.dateFilter.isActive || !this.originalRawText) return;

        // Filter raw text by date range
        const filteredText = this.filterTextByDateRange(this.originalRawText);
        
        // Parse the filtered text
        this.parsedData = parser.parse(filteredText);

        console.log(`Filtered text and re-parsed: ${this.parsedData.messages.length} messages in filtered range`);
    }

    filterTextByDateRange(text) {
        const lines = text.split('\n');
        const filteredLines = [];
        
        let currentMessageDate = null;
        let isInRange = false;

        for (const line of lines) {
            let lineDate = null;
            
            // Try to extract date using parser's patterns (both message and system patterns)
            const allPatterns = [...parser.messagePatterns, ...parser.systemMessagePatterns];
            for (const pattern of allPatterns) {
                const match = line.match(pattern);
                if (match) {
                    lineDate = this.parseDateFromMatch(match);
                    if (lineDate) {
                        currentMessageDate = lineDate;
                        isInRange = this.isDateInRange(lineDate);
                        break;
                    }
                }
            }

            // If this line starts a new message, check if it's in range
            if (lineDate) {
                if (isInRange) {
                    filteredLines.push(line);
                }
            } else if (isInRange && currentMessageDate) {
                // This is a continuation line of a message that's in range
                filteredLines.push(line);
            }
        }

        const filteredText = filteredLines.join('\n');
        console.log(`Filtered text from ${lines.length} lines to ${filteredLines.length} lines`);
        
        return filteredText;
    }

    parseDateFromMatch(match) {
        try {
            // Extract the full date-time string (first capture group)
            const dateTimeStr = match[1];
            
            // Parse the date using parser's existing methods
            const { date, time } = parser.parseTimestampString(dateTimeStr);
            return parser.parseTimestamp(date, time);
        } catch (error) {
            console.warn('Error parsing date from match:', error);
            return null;
        }
    }

    isDateInRange(date) {
        if (!this.dateFilter.isActive || !date) return true;
        
        return date >= this.dateFilter.startDate && date <= this.dateFilter.endDate;
    }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WhatsAppAnalyzerApp();
});

export default WhatsAppAnalyzerApp;
