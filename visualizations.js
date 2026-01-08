// Visualization Module using Chart.js

export class ChartBuilder {
    constructor() {
        this.defaultColors = {
            primary: '#00f3ff',   // Neon Cyan
            secondary: '#bd00ff', // Neon Purple
            accent: '#0066ff',    // Neon Blue
            success: '#00ffa3',   // Neon Green
            danger: '#ff0055',    // Neon Red
            warning: '#ffcc00',   // Neon Yellow
            info: '#0066ff'
        };

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 10, // Extra space for x-axis labels
                    left: 5,
                    right: 5,
                    top: 5
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { family: "'Space Grotesk', sans-serif" },
                        padding: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(2, 4, 10, 0.9)',
                    titleColor: '#00f3ff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(0, 243, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: { family: "'Space Grotesk'" },
                        padding: 5 // Add padding to prevent label cutoff
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: { family: "'Space Grotesk'" },
                        padding: 5
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        };
    }

    /**
     * Create message frequency timeline chart
     */
    createTimelineChart(ctx, data) {
        const dates = Object.keys(data).sort();
        const counts = dates.map(date => data[date]);

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Messages per Day',
                    data: counts,
                    borderColor: this.defaultColors.primary,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    ...this.chartOptions.scales,
                    x: {
                        ...this.chartOptions.scales.x,
                        type: 'time',
                        time: { unit: 'day' }
                    }
                }
            }
        });
    }

    /**
     * Create hourly activity heatmap (Neon Bar)
     */
    createHourlyHeatmap(ctx, hourlyData) {
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Activity Intensity',
                    data: hourlyData,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                        gradient.addColorStop(0, '#bd00ff');
                        gradient.addColorStop(1, '#00f3ff');
                        return gradient;
                    },
                    borderRadius: 4,
                    borderWidth: 0
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                            font: { size: 10 },
                            maxRotation: 0,
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    legend: { display: false }
                }
            }
        });
    }

    /**
     * Create day of week activity chart
     */
    createDayOfWeekChart(ctx, dailyData, dayNames) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dayNames,
                datasets: [{
                    label: 'Messages',
                    data: dailyData,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: this.defaultColors.primary,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                            font: { size: 11 },
                            maxRotation: 0,
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    legend: { display: false }
                }
            }
        });
    }

    /**
     * Create message count comparison (Holographic Doughnut)
     */
    createMessageCountPie(ctx, participants, counts) {
        const colors = [this.defaultColors.primary, this.defaultColors.secondary, this.defaultColors.accent, this.defaultColors.success];

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: participants,
                datasets: [{
                    data: participants.map(p => counts[p]),
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#fff',
                            font: { family: "'Space Grotesk'" },
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    /**
     * Create response time chart (Horizontal Neon)
     */
    createResponseTimeChart(ctx, distribution) {
        const labels = Object.keys(distribution);
        const data = Object.values(distribution);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Responses',
                    data,
                    backgroundColor: this.defaultColors.accent,
                    borderRadius: 4,
                    barThickness: 10
                }]
            },
            options: {
                ...this.chartOptions,
                indexAxis: 'y',
                plugins: {
                    ...this.chartOptions.plugins,
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.7)' }
                    }
                }
            }
        });
    }

    /**
     * Create individual response time by participant chart
     */
    createIndividualResponseTimeChart(ctx, byParticipant) {
        const participants = Object.keys(byParticipant.average);
        const avgTimes = participants.map(p => byParticipant.average[p] / (1000 * 60)); // Convert to minutes
        const medianTimes = participants.map(p => byParticipant.median[p] / (1000 * 60)); // Convert to minutes

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: participants,
                datasets: [
                    {
                        label: 'Average Response Time',
                        data: avgTimes,
                        backgroundColor: 'rgba(0, 243, 255, 0.6)',
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1,
                        borderRadius: 8
                    },
                    {
                        label: 'Median Response Time',
                        data: medianTimes,
                        backgroundColor: 'rgba(189, 0, 255, 0.6)',
                        borderColor: this.defaultColors.secondary,
                        borderWidth: 1,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function (context) {
                                const minutes = context.parsed.y;
                                if (minutes < 60) {
                                    return `${context.dataset.label}: ${minutes.toFixed(1)} min`;
                                } else {
                                    const hours = (minutes / 60).toFixed(1);
                                    return `${context.dataset.label}: ${hours} hrs`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                            font: { size: 11 },
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function (value) {
                                if (value < 60) {
                                    return value.toFixed(0) + ' min';
                                } else {
                                    return (value / 60).toFixed(1) + ' hrs';
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create top words "Bubble" Chart
     * (Simulated using Scatter/Bubble logic or styled Bar)
     * We'll stick to a highly styled Bar chart to ensure reliability, 
     * but give it a "floating" gradient look.
     */
    createTopWordsChart(ctx, topWords) {
        // Limit to top 10 words for cleaner display
        const limitedWords = topWords.slice(0, 10);
        const words = limitedWords.map(w => w.word);
        const counts = limitedWords.map(w => w.count);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: words,
                datasets: [{
                    label: 'Frequency',
                    data: counts,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
                        gradient.addColorStop(1, 'rgba(189, 0, 255, 0.2)');
                        return gradient;
                    },
                    borderRadius: 20, // Clean rounded look
                    barPercentage: 0.7
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#fff',
                            font: { size: 11 },
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    y: { display: false } // Hide Y axis for cleaner look
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    /**
     * Create top emojis chart
     */
    createEmojiChart(ctx, topEmojis) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topEmojis.map(e => e.emoji),
                datasets: [{
                    label: 'Usage',
                    data: topEmojis.map(e => e.count),
                    backgroundColor: this.defaultColors.warning,
                    borderRadius: 5
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: { legend: { display: false } }
            }
        });
    }

    /**
     * Create monthly trend chart
     */
    createMonthlyTrendChart(ctx, monthlyData) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [{
                    label: 'Monthly Trend',
                    data: monthlyData.map(d => d.count),
                    borderColor: this.defaultColors.secondary,
                    borderWidth: 3,
                    pointBackgroundColor: '#000',
                    pointBorderColor: this.defaultColors.secondary,
                    pointBorderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    createMediaSharingChart(ctx, mediaData) {
        // Implementation kept consistent if needed
    }

    /**
     * Create message length comparison chart
     */
    createMessageLengthChart(ctx, statsData) {
        const participants = Object.keys(statsData);
        const avgLengths = participants.map(p => Math.round(statsData[p].averageLength));
        const avgWords = participants.map(p => Math.round(statsData[p].averageWords));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: participants,
                datasets: [
                    {
                        label: 'Avg Characters',
                        data: avgLengths,
                        backgroundColor: 'rgba(0, 243, 255, 0.6)',
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1,
                        borderRadius: 8
                    },
                    {
                        label: 'Avg Words',
                        data: avgWords,
                        backgroundColor: 'rgba(189, 0, 255, 0.6)',
                        borderColor: this.defaultColors.secondary,
                        borderWidth: 1,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                            font: { size: 11 },
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                }
            }
        });
    }

    /**
     * Create conversation streaks chart
     */
    createStreaksChart(ctx, streaksData) {
        if (!streaksData.longestStreak) return null;

        const avgStreakLength = streaksData.totalStreaks > 0
            ? (streaksData.top5Streaks.reduce((sum, s) => sum + s.days.length, 0) / Math.min(5, streaksData.totalStreaks)).toFixed(1)
            : 0;

        const data = [
            { label: 'Maximum Streak (days)', value: streaksData.longestStreak.days.length },
            { label: 'Average Streak (days)', value: parseFloat(avgStreakLength) }
        ];

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: [
                        'rgba(0, 243, 255, 0.7)',
                        'rgba(189, 0, 255, 0.7)'
                    ],
                    borderRadius: 10,
                    barPercentage: 0.7
                }]
            },
            options: {
                ...this.chartOptions,
                indexAxis: 'y', // Horizontal bars
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    y: {
                        ticks: {
                            color: '#fff',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create conversation initiators chart
     */
    createInitiatorsChart(ctx, initiatorsData) {
        const participants = Object.keys(initiatorsData);
        const counts = participants.map(p => initiatorsData[p]);
        const total = counts.reduce((sum, count) => sum + count, 0);
        const percentages = counts.map(c => ((c / total) * 100).toFixed(1));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: participants,
                datasets: [{
                    label: 'Initiations',
                    data: counts,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                        gradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
                        gradient.addColorStop(1, 'rgba(189, 0, 255, 0.4)');
                        return gradient;
                    },
                    borderRadius: 10,
                    barPercentage: 0.6
                }]
            },
            options: {
                ...this.chartOptions,
                indexAxis: 'y', // Horizontal bars
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function (context) {
                                const index = context.dataIndex;
                                return `${context.parsed.x} conversations (${percentages[index]}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    y: {
                        ticks: {
                            color: '#fff',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create conversation enders chart
     */
    createConversationEndersChart(ctx, participants, counts, percentages) {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: participants,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(0, 243, 255, 0.8)',
                        'rgba(189, 0, 255, 0.8)',
                        'rgba(255, 204, 0, 0.8)',
                        'rgba(0, 255, 163, 0.8)'
                    ],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: { family: "'Space Grotesk'", size: 12 },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function (context) {
                                const index = context.dataIndex;
                                return `${context.label}: ${context.parsed} times (${percentages[index]}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateGradientColors(count) {

        // Implementation
    }

    static destroyChart(chart) {
        if (chart) chart.destroy();
    }
}

export default ChartBuilder;
