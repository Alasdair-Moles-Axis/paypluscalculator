/**
 * Tungsten Pay+ ROI Calculator - Calculation Engine
 * Handles all cost calculations and data transformations
 */

class ROICalculator {
    constructor() {
        this.data = this.getDefaultData();
    }

    /**
     * Get default data structure
     */
    getDefaultData() {
        return {
            customerInfo: {
                totalPaymentVolume: 50000000,
                paymentDistribution: {
                    localPercent: 60,
                    crossBorderPercent: 40
                },
                fxVolume: {
                    total: 10000000,
                    distribution: {
                        tier1Percent: 40,
                        tier2Percent: 35,
                        tier3Percent: 25
                    }
                },
                cardVolume: 5000000
            },
            fees: {
                tungsten: {
                    localRail: 0.15,
                    crossBorder: 0.25,
                    fxMargins: {
                        tier1: 0.50,
                        tier2: 0.35,
                        tier3: 0.20
                    },
                    cardInterchange: 1.50
                },
                currentProvider: {
                    localRail: 0.25,
                    crossBorder: 0.50,
                    fxMargins: {
                        tier1: 0.75,
                        tier2: 0.60,
                        tier3: 0.45
                    },
                    cardInterchange: 2.00
                }
            }
        };
    }

    /**
     * Update customer information
     */
    updateCustomerInfo(field, value) {
        const keys = field.split('.');
        let obj = this.data.customerInfo;
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = parseFloat(value) || 0;
    }

    /**
     * Update fee information
     */
    updateFee(provider, field, value) {
        const keys = field.split('.');
        let obj = this.data.fees[provider];
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = parseFloat(value) || 0;
    }

    /**
     * Calculate payment volumes based on distribution
     */
    calculatePaymentVolumes() {
        const total = this.data.customerInfo.totalPaymentVolume;
        const localPercent = this.data.customerInfo.paymentDistribution.localPercent;
        
        return {
            local: total * (localPercent / 100),
            crossBorder: total * ((100 - localPercent) / 100),
            localPercent: localPercent,
            crossBorderPercent: 100 - localPercent
        };
    }

    /**
     * Calculate FX volumes by tier
     */
    calculateFXVolumes() {
        const total = this.data.customerInfo.fxVolume.total;
        const dist = this.data.customerInfo.fxVolume.distribution;
        
        return {
            tier1: total * (dist.tier1Percent / 100),
            tier2: total * (dist.tier2Percent / 100),
            tier3: total * (dist.tier3Percent / 100),
            total: total
        };
    }

    /**
     * Calculate costs for a given provider
     */
    calculateProviderCosts(provider) {
        const paymentVolumes = this.calculatePaymentVolumes();
        const fxVolumes = this.calculateFXVolumes();
        const fees = this.data.fees[provider];
        const cardVolume = this.data.customerInfo.cardVolume;

        // Local rail costs
        const localRailCost = paymentVolumes.local * (fees.localRail / 100);

        // Cross-border costs
        const crossBorderCost = paymentVolumes.crossBorder * (fees.crossBorder / 100);

        // FX costs by tier
        const fxTier1Cost = fxVolumes.tier1 * (fees.fxMargins.tier1 / 100);
        const fxTier2Cost = fxVolumes.tier2 * (fees.fxMargins.tier2 / 100);
        const fxTier3Cost = fxVolumes.tier3 * (fees.fxMargins.tier3 / 100);
        const fxTotalCost = fxTier1Cost + fxTier2Cost + fxTier3Cost;

        // Card costs
        const cardCost = cardVolume * (fees.cardInterchange / 100);

        // Total cost
        const totalCost = localRailCost + crossBorderCost + fxTotalCost + cardCost;

        return {
            localRail: localRailCost,
            crossBorder: crossBorderCost,
            fx: {
                tier1: fxTier1Cost,
                tier2: fxTier2Cost,
                tier3: fxTier3Cost,
                total: fxTotalCost
            },
            cards: cardCost,
            total: totalCost
        };
    }

    /**
     * Calculate savings and ROI
     */
    calculateSavings() {
        const currentCosts = this.calculateProviderCosts('currentProvider');
        const tungstenCosts = this.calculateProviderCosts('tungsten');

        const savings = {
            localRail: currentCosts.localRail - tungstenCosts.localRail,
            crossBorder: currentCosts.crossBorder - tungstenCosts.crossBorder,
            fx: currentCosts.fx.total - tungstenCosts.fx.total,
            cards: currentCosts.cards - tungstenCosts.cards,
            total: currentCosts.total - tungstenCosts.total
        };

        const roiPercentage = currentCosts.total > 0 
            ? (savings.total / currentCosts.total) * 100 
            : 0;

        return {
            currentCosts,
            tungstenCosts,
            savings,
            roiPercentage
        };
    }

    /**
     * Get complete calculation results
     */
    getResults() {
        const paymentVolumes = this.calculatePaymentVolumes();
        const fxVolumes = this.calculateFXVolumes();
        const savingsData = this.calculateSavings();

        return {
            volumes: {
                payments: paymentVolumes,
                fx: fxVolumes,
                cards: this.data.customerInfo.cardVolume
            },
            costs: {
                current: savingsData.currentCosts,
                tungsten: savingsData.tungstenCosts
            },
            savings: savingsData.savings,
            roi: savingsData.roiPercentage,
            data: this.data
        };
    }

    /**
     * Validate input data
     */
    validate() {
        const errors = [];

        // Validate total payment volume
        if (this.data.customerInfo.totalPaymentVolume < 0) {
            errors.push('Total payment volume must be positive');
        }

        // Validate payment distribution
        const paymentDist = this.data.customerInfo.paymentDistribution;
        if (paymentDist.localPercent < 0 || paymentDist.localPercent > 100) {
            errors.push('Local payment percentage must be between 0 and 100');
        }

        // Validate FX volume
        if (this.data.customerInfo.fxVolume.total < 0) {
            errors.push('FX volume must be positive');
        }

        // Validate FX distribution
        const fxDist = this.data.customerInfo.fxVolume.distribution;
        const fxTotal = fxDist.tier1Percent + fxDist.tier2Percent + fxDist.tier3Percent;
        if (Math.abs(fxTotal - 100) > 0.01) {
            errors.push('FX distribution must sum to 100%');
        }

        // Validate card volume
        if (this.data.customerInfo.cardVolume < 0) {
            errors.push('Card volume must be positive');
        }

        // Validate fees
        const validateFees = (fees, provider) => {
            if (fees.localRail < 0 || fees.localRail > 100) {
                errors.push(`${provider} local rail fee must be between 0 and 100%`);
            }
            if (fees.crossBorder < 0 || fees.crossBorder > 100) {
                errors.push(`${provider} cross-border fee must be between 0 and 100%`);
            }
            if (fees.cardInterchange < 0 || fees.cardInterchange > 100) {
                errors.push(`${provider} card interchange must be between 0 and 100%`);
            }
            Object.values(fees.fxMargins).forEach((margin, i) => {
                if (margin < 0 || margin > 100) {
                    errors.push(`${provider} FX margin tier ${i + 1} must be between 0 and 100%`);
                }
            });
        };

        validateFees(this.data.fees.tungsten, 'Tungsten');
        validateFees(this.data.fees.currentProvider, 'Current provider');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Export data for saving
     */
    exportData() {
        return JSON.parse(JSON.stringify(this.data));
    }

    /**
     * Import data from saved state
     */
    importData(data) {
        this.data = JSON.parse(JSON.stringify(data));
    }

    /**
     * Reset to default values
     */
    reset() {
        this.data = this.getDefaultData();
    }
}

/**
 * Utility functions for formatting
 */
const FormatUtils = {
    /**
     * Format number as currency
     */
    formatCurrency(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '$0';
        }
        
        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        
        if (absValue >= 1000000000) {
            return `${sign}$${(absValue / 1000000000).toFixed(2)}B`;
        } else if (absValue >= 1000000) {
            return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
        } else if (absValue >= 1000) {
            return `${sign}$${(absValue / 1000).toFixed(2)}K`;
        } else {
            return `${sign}$${absValue.toFixed(decimals)}`;
        }
    },

    /**
     * Format number with commas
     */
    formatNumber(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        
        return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Format percentage
     */
    formatPercent(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        
        return `${value.toFixed(decimals)}%`;
    },

    /**
     * Parse currency input
     */
    parseCurrency(value) {
        if (typeof value === 'number') {
            return value;
        }
        
        const cleaned = String(value).replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ROICalculator, FormatUtils };
}