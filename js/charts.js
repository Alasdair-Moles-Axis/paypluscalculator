/**
 * Tungsten Pay+ ROI Calculator - Charts Module
 * Handles all Chart.js visualizations
 */

class ChartsManager {
    constructor() {
        this.charts = {};
        // Monochrome color palette - Prussian Blue and grays only
        this.colors = {
            primary: '#002854',      // Tungsten Prussian Blue
            gray1: '#4B5563',        // Dark gray
            gray2: '#6B7280',        // Medium gray
            gray3: '#9CA3AF',        // Light gray
            gray4: '#D1D5DB',        // Very light gray
            // Semantic colors (all using monochrome palette)
            local: '#002854',
            crossBorder: '#6B7280',
            tier1: '#002854',
            tier2: '#6B7280',
            tier3: '#9CA3AF',
            current: '#6B7280',
            tungsten: '#002854',
            savings: '#002854',
            fx: '#9CA3AF',
            cards: '#D1D5DB'
        };
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        this.createPaymentDistributionChart();
        this.createFXDistributionChart();
        this.createCostComparisonChart();
        this.createSavingsBreakdownChart();
        this.createCurrentDistributionChart();
        this.createTungstenDistributionChart();
    }

    /**
     * Create Payment Distribution Chart (Pie/Doughnut)
     */
    createPaymentDistributionChart() {
        const ctx = document.getElementById('payment-distribution-chart');
        if (!ctx) return;

        this.charts.paymentDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Local Payments', 'Cross-Border Payments'],
                datasets: [{
                    data: [60, 40],
                    backgroundColor: [this.colors.local, this.colors.crossBorder],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 13,
                                family: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        displayColors: true
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 300
                }
            }
        });
    }

    /**
     * Create FX Distribution Chart (Pie/Doughnut)
     */
    createFXDistributionChart() {
        const ctx = document.getElementById('fx-distribution-chart');
        if (!ctx) return;

        this.charts.fxDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Tier 1: 0-100k', 'Tier 2: 100k-500k', 'Tier 3: >500k'],
                datasets: [{
                    data: [40, 35, 25],
                    backgroundColor: [this.colors.tier1, this.colors.tier2, this.colors.tier3],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 13,
                                family: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        displayColors: true
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 300
                }
            }
        });
    }

    /**
     * Create Cost Comparison Chart (Grouped Bar)
     */
    createCostComparisonChart() {
        const ctx = document.getElementById('cost-comparison-chart');
        if (!ctx) return;

        this.charts.costComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Local Rail', 'Cross-Border', 'FX', 'Card Rebates*'],
                datasets: [
                    {
                        label: 'Current Provider',
                        data: [0, 0, 0, 0],
                        backgroundColor: this.colors.current,
                        borderRadius: 6
                    },
                    {
                        label: 'Tungsten Pay+',
                        data: [0, 0, 0, 0],
                        backgroundColor: this.colors.tungsten,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 15,
                            font: {
                                size: 14,
                                family: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${FormatUtils.formatCurrency(value, 0)}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return FormatUtils.formatCurrency(value, 0);
                            },
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 13 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create Savings Breakdown Chart (Horizontal Bar)
     */
    createSavingsBreakdownChart() {
        const ctx = document.getElementById('savings-breakdown-chart');
        if (!ctx) return;

        this.charts.savingsBreakdown = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Local Rail', 'Cross-Border', 'FX', 'Card Rebates*'],
                datasets: [{
                    label: 'Annual Savings',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        this.colors.savings,
                        this.colors.savings,
                        this.colors.savings,
                        this.colors.gray2  // Different color for card rebates
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x || 0;
                                const label = context.label.includes('Card') ? 'Rebate Benefit' : 'Savings';
                                return `${label}: ${FormatUtils.formatCurrency(Math.abs(value), 0)}`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return FormatUtils.formatCurrency(Math.abs(value), 0);
                            },
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 13 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create Current Provider Distribution Chart (Pie)
     */
    createCurrentDistributionChart() {
        const ctx = document.getElementById('current-distribution-chart');
        if (!ctx) return;

        this.charts.currentDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Local Rail', 'Cross-Border', 'FX'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        this.colors.local,
                        this.colors.crossBorder,
                        this.colors.fx
                    ],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                family: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${FormatUtils.formatCurrency(value, 0)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                }
            }
        });
    }

    /**
     * Create Tungsten Distribution Chart (Pie)
     */
    createTungstenDistributionChart() {
        const ctx = document.getElementById('tungsten-distribution-chart');
        if (!ctx) return;

        this.charts.tungstenDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Local Rail', 'Cross-Border', 'FX'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        this.colors.local,
                        this.colors.crossBorder,
                        this.colors.fx
                    ],
                    borderWidth: 2,
                    borderColor: ['#FFFFFF', '#FFFFFF', '#FFFFFF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12,
                                family: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${FormatUtils.formatCurrency(value, 0)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                }
            }
        });
    }

    /**
     * Update all charts with new data - new separated structure
     */
    updateCharts(results) {
        // Skip payment distribution chart (not in results panel)
        this.updateFXDistributionChart(results.data.customerInfo.fxVolume.distribution);
        this.updateCostComparisonChart(results.detailedCosts);
        this.updateSavingsBreakdownChart(results.costs, results.incentives);
        this.updateDistributionCharts(results.detailedCosts, results.costs.savings);
    }

    /**
     * Update Payment Distribution Chart (not used in new design)
     */
    updatePaymentDistributionChart(payments) {
        if (!this.charts.paymentDistribution) return;

        this.charts.paymentDistribution.data.datasets[0].data = [
            payments.localPercent || 0,
            payments.crossBorderPercent || 0
        ];
        this.charts.paymentDistribution.update('active');
    }

    /**
     * Update FX Distribution Chart
     */
    updateFXDistributionChart(distribution) {
        if (!this.charts.fxDistribution) return;

        this.charts.fxDistribution.data.datasets[0].data = [
            distribution.tier1Percent,
            distribution.tier2Percent,
            distribution.tier3Percent
        ];
        this.charts.fxDistribution.update('active');
    }

    /**
     * Update Cost Comparison Chart - uses detailed costs
     */
    updateCostComparisonChart(detailedCosts) {
        if (!this.charts.costComparison) return;

        this.charts.costComparison.data.datasets[0].data = [
            detailedCosts.current.localRail || 0,
            detailedCosts.current.crossBorderRail || 0,
            detailedCosts.current.fx.total || 0,
            detailedCosts.current.cardRebate || 0
        ];

        this.charts.costComparison.data.datasets[1].data = [
            detailedCosts.tungsten.localRail || 0,
            detailedCosts.tungsten.crossBorderRail || 0,
            detailedCosts.tungsten.fx.total || 0,
            detailedCosts.tungsten.cardRebate || 0
        ];

        this.charts.costComparison.update('active');
    }

    /**
     * Update Savings Breakdown Chart - uses cost savings structure
     */
    updateSavingsBreakdownChart(costs, incentives) {
        if (!this.charts.savingsBreakdown) return;

        // Show cost savings + incentive differential (always positive)
        this.charts.savingsBreakdown.data.datasets[0].data = [
            costs.savings.localRail || 0,
            costs.savings.crossBorderRail || 0,
            costs.savings.fx || 0,
            Math.abs(incentives.differential || 0)  // Always positive
        ];

        this.charts.savingsBreakdown.update('active');
    }

    /**
     * Update Distribution Charts (costs only - no rebates) - uses detailed costs
     */
    updateDistributionCharts(detailedCosts, costSavings) {
        // Current Provider - show only costs (3 segments: rails + FX, no cards)
        if (this.charts.currentDistribution) {
            this.charts.currentDistribution.data.labels = [
                'Local rail',
                'Cross-border',
                'FX'
            ];
            
            this.charts.currentDistribution.data.datasets[0].data = [
                detailedCosts.current.localRail || 0,
                detailedCosts.current.crossBorderRail || 0,
                detailedCosts.current.fx.total || 0
            ];
            
            this.charts.currentDistribution.data.datasets[0].backgroundColor = [
                this.colors.local,
                this.colors.crossBorder,
                this.colors.fx
            ];
            
            this.charts.currentDistribution.update('active');
        }

        // Tungsten Pay+ - show costs + white space for savings (4 segments)
        if (this.charts.tungstenDistribution) {
            const savings = costSavings.total || 0;
            
            this.charts.tungstenDistribution.data.labels = [
                'Local rail',
                'Cross-border',
                'FX',
                'Your savings'
            ];
            
            this.charts.tungstenDistribution.data.datasets[0].data = [
                detailedCosts.tungsten.localRail || 0,
                detailedCosts.tungsten.crossBorderRail || 0,
                detailedCosts.tungsten.fx.total || 0,
                savings > 0 ? savings : 0
            ];
            
            this.charts.tungstenDistribution.data.datasets[0].backgroundColor = [
                this.colors.local,
                this.colors.crossBorder,
                this.colors.fx,
                '#FFFFFF'  // White for savings segment
            ];
            
            // Add gray border to savings segment to make it visible
            this.charts.tungstenDistribution.data.datasets[0].borderColor = [
                '#FFFFFF',
                '#FFFFFF',
                '#FFFFFF',
                '#9CA3AF'  // Gray border for white savings segment
            ];
            
            this.charts.tungstenDistribution.update('active');
        }
    }

    /**
     * Destroy all charts
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Resize all charts
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsManager;
}