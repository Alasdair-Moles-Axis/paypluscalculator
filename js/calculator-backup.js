/**
 * Tungsten Pay+ ROI Calculator - Calculation Engine V2
 * Updated with flat fees and transaction-based calculations
 */

class ROICalculator {
    constructor() {
        this.data = this.getDefaultData();
        this.lastEditedField = {
            local: 'count',  // or 'averageValue'
            crossBorder: 'count'
        };
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
                transactions: {
                    local: {
                        count: 1000000,           // Number of transactions
                        averageValue: 30,         // Average transaction value
                        volume: 30000000          // Calculated
                    },
                    crossBorder: {
                        count: 100000,
                        averageValue: 200,
                        volume: 20000000
                    }
                },
                fxVolume: {
                    total: 10000000,
                    distribution: {
                        tier1Percent: 40,
                        tier2Percent: 35,
                        tier3Percent: 25
                    }
                },
                cardVolume: 5000000,
                implementationCost: 50000
            },
            fees: {
                tungsten: {
                    localRailFee: 0.50,          // Flat fee per transaction
                    crossBorderFee: 2.00,        // Flat fee per transaction
                    fxMargins: {
                        tier1: 0.50,             // Percentage
                        tier2: 0.35,
                        tier3: 0.20
                    },
                    cardInterchange: 1.50        // Percentage
                },
                currentProvider: {
                    localRailFee: 1.00,
                    crossBorderFee: 3.50,
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
        
        // Track which field was edited for auto-calculation
        if (field.includes('transactions.local.count')) {
            this.lastEditedField.local = 'count';
        } else if (field.includes('transactions.local.averageValue')) {
            this.lastEditedField.local = 'averageValue';
        } else if (field.includes('transactions.crossBorder.count')) {
            this.lastEditedField.crossBorder = 'count';
        } else if (field.includes('transactions.crossBorder.averageValue')) {
            this.lastEditedField.crossBorder = 'averageValue';
        }
    }

    /**
     * Update transaction metrics (count or average value)
     */
    updateTransactionMetrics(type, field, value) {
        const trans = this.data.customerInfo.transactions[type];
        const numValue = parseFloat(value) || 0;
        
        trans[field] = numValue;
        this.lastEditedField[type] = field;
        
        // Recalculate volume
        if (field === 'count') {
            trans.volume = trans.count * trans.averageValue;
        } else if (field === 'averageValue') {
            trans.volume = trans.count * trans.averageValue;
        }
        
        // Update total payment volume to match
        const localVol = this.data.customerInfo.transactions.local.volume;
        const crossVol = this.data.customerInfo.transactions.crossBorder.volume;
        this.data.customerInfo.totalPaymentVolume = localVol + crossVol;
        
        // Update distribution percentages
        const total = this.data.customerInfo.totalPaymentVolume;
        if (total > 0) {
            this.data.customerInfo.paymentDistribution.localPercent = (localVol / total) * 100;
            this.data.customerInfo.paymentDistribution.crossBorderPercent = (crossVol / total) * 100;
        }
    }

    /**
     * Update fee information
     */
    updateFee(provider, field, value) {
        const keys = field.split('.');
        let obj = this.data.fees[provider];
        
        // Handle field name mapping for backwards compatibility
        const fieldMap = {
            'localRail': 'localRailFee',
            'crossBorder': 'crossBorderFee'
        };
        
        // Map the last key if needed
        if (keys.length === 1 && fieldMap[keys[0]]) {
            keys[0] = fieldMap[keys[0]];
        }
        
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
        
        const localVolume = total * (localPercent / 100);
        const crossBorderVolume = total * ((100 - localPercent) / 100);
        
        // Update transaction volumes
        this.data.customerInfo.transactions.local.volume = localVolume;
        this.data.customerInfo.transactions.crossBorder.volume = crossBorderVolume;
        
        // Auto-calculate transaction metrics based on last edited field
        this.autoCalculateTransactionMetrics('local', localVolume);
        this.autoCalculateTransactionMetrics('crossBorder', crossBorderVolume);
        
        return {
            local: localVolume,
            crossBorder: crossBorderVolume,
            localPercent: localPercent,
            crossBorderPercent: 100 - localPercent
        };
    }

    /**
     * Auto-calculate transaction count or average value
     */
    autoCalculateTransactionMetrics(type, volume) {
        const trans = this.data.customerInfo.transactions[type];
        
        if (this.lastEditedField[type] === 'count' && trans.count > 0) {
            // User edited count, calculate average value
            trans.averageValue = volume / trans.count;
        } else if (this.lastEditedField[type] === 'averageValue' && trans.averageValue > 0) {
            // User edited average value, calculate count
            trans.count = Math.round(volume / trans.averageValue);
        } else if (trans.count > 0) {
            // Default: calculate average value from count
            trans.averageValue = volume / trans.count;
        } else if (trans.averageValue > 0) {
            // Fallback: calculate count from average value
            trans.count = Math.round(volume / trans.averageValue);
        } else {
            // No data, set defaults
            trans.count = Math.round(volume / 50); // Assume $50 average
            trans.averageValue = 50;
        }
        
        trans.volume = volume;
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
     * Calculate costs for a given provider (UPDATED FOR FLAT FEES)
     */
    calculateProviderCosts(provider) {
        const paymentVolumes = this.calculatePaymentVolumes();
        const fxVolumes = this.calculateFXVolumes();
        const fees = this.data.fees[provider];
        const cardVolume = this.data.customerInfo.cardVolume;
        const transactions = this.data.customerInfo.transactions;

        // Local rail costs (FLAT FEE PER TRANSACTION)
        const localRailCost = transactions.local.count * fees.localRailFee;

        // Cross-border costs (FLAT FEE PER TRANSACTION)
        const crossBorderCost = transactions.crossBorder.count * fees.crossBorderFee;

        // FX costs by tier (PERCENTAGE - unchanged)
        const fxTier1Cost = fxVolumes.tier1 * (fees.fxMargins.tier1 / 100);
        const fxTier2Cost = fxVolumes.tier2 * (fees.fxMargins.tier2 / 100);
        const fxTier3Cost = fxVolumes.tier3 * (fees.fxMargins.tier3 / 100);
        const fxTotalCost = fxTier1Cost + fxTier2Cost + fxTier3Cost;

        // Card costs (PERCENTAGE - unchanged)
        const cardCost = cardVolume * (fees.cardInterchange / 100);

        // Total cost
        const totalCost = localRailCost + crossBorderCost + fxTotalCost + cardCost;

        // Calculate cost per transaction
        const totalTransactions = transactions.local.count + transactions.crossBorder.count;
        const costPerTransaction = totalTransactions > 0 ? totalCost / totalTransactions : 0;

        // Calculate effective rate
        const totalVolume = paymentVolumes.local + paymentVolumes.crossBorder + cardVolume;
        const effectiveRate = totalVolume > 0 ? (totalCost / totalVolume) * 100 : 0;

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
            total: totalCost,
            costPerTransaction: costPerTransaction,
            effectiveRate: effectiveRate
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
            total: currentCosts.total - tungstenCosts.total,
            costPerTransaction: currentCosts.costPerTransaction - tungstenCosts.costPerTransaction,
            effectiveRate: currentCosts.effectiveRate - tungstenCosts.effectiveRate
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
            transactions: this.data.customerInfo.transactions,
            costs: {
                current: savingsData.currentCosts,
                tungsten: savingsData.tungstenCosts
            },
            savings: savingsData.savings,
            roi: savingsData.roiPercentage,
            implementationCost: savingsData.implementationCost,
            timeToROI: savingsData.timeToROI,
            data: this.data
        };
    }

    /**
     * Adjust FX tier percentages proportionally
     */
    adjustFXTiers(changedTier, newValue) {
        const dist = this.data.customerInfo.fxVolume.distribution;
        const oldValue = dist[`tier${changedTier}Percent`];
        const change = newValue - oldValue;
        
        // Update the changed tier
        dist[`tier${changedTier}Percent`] = newValue;
        
        // Calculate remaining percentage
        const remaining = 100 - newValue;
        
        // Get the other two tiers
        const otherTiers = [1, 2, 3].filter(t => t !== changedTier);
        const tier1 = otherTiers[0];
        const tier2 = otherTiers[1];
        
        const currentTier1 = dist[`tier${tier1}Percent`];
        const currentTier2 = dist[`tier${tier2}Percent`];
        const currentTotal = currentTier1 + currentTier2;
        
        if (currentTotal > 0) {
            // Distribute remaining proportionally
            dist[`tier${tier1}Percent`] = (currentTier1 / currentTotal) * remaining;
            dist[`tier${tier2}Percent`] = (currentTier2 / currentTotal) * remaining;
        } else {
            // Equal distribution
            dist[`tier${tier1}Percent`] = remaining / 2;
            dist[`tier${tier2}Percent`] = remaining / 2;
        }
        
        // Ensure we're at exactly 100%
        const total = dist.tier1Percent + dist.tier2Percent + dist.tier3Percent;
        if (Math.abs(total - 100) > 0.01) {
            // Adjust tier3 to compensate for rounding
            dist.tier3Percent += (100 - total);
        }
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

        // Validate transaction counts
        const trans = this.data.customerInfo.transactions;
        if (trans.local.count < 0 || trans.crossBorder.count < 0) {
            errors.push('Transaction counts must be positive');
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
            if (fees.localRailFee < 0) {
                errors.push(`${provider} local rail fee must be positive`);
            }
            if (fees.crossBorderFee < 0) {
                errors.push(`${provider} cross-border fee must be positive`);
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