/**
 * Tungsten Pay+ ROI Calculator - V3
 * Complete rewrite with simplified UX and multi-currency support
 */

class ROICalculator {
    constructor() {
        this.data = this.getDefaultData();
        this.exchangeRates = {
            USD: 1.00,
            GBP: 0.79,
            EUR: 0.92
        };
    }

    /**
     * Get default data structure
     */
    getDefaultData() {
        return {
            customerInfo: {
                currency: 'USD',
                totalPaymentValue: 50000000,
                totalPaymentCount: 1100000,
                
                paymentTypeDistribution: {
                    localPercent: 60,
                    crossBorderPercent: 40
                },
                
                paymentMethodDistribution: {
                    railPercent: 90,
                    cardPercent: 10
                },
                
                // FX is now percentage of cross-border rail payments
                fxPercentOfCrossBorder: 50,
                fxVolume: {
                    distribution: {
                        tier1Percent: 40,
                        tier2Percent: 35,
                        tier3Percent: 25
                    }
                }
            },
            fees: {
                tungsten: {
                    localRailFee: 0.50,
                    crossBorderFee: 2.00,
                    fxMargins: {
                        tier1: 0.50,
                        tier2: 0.35,
                        tier3: 0.20
                    },
                    cardRebate: 1.50
                },
                currentProvider: {
                    localRailFee: 1.00,
                    crossBorderFee: 3.50,
                    fxMargins: {
                        tier1: 0.75,
                        tier2: 0.60,
                        tier3: 0.45
                    },
                    cardRebate: 1.00
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
        
        const fieldMap = {
            'localRail': 'localRailFee',
            'crossBorder': 'crossBorderFee'
        };
        
        if (keys.length === 1 && fieldMap[keys[0]]) {
            keys[0] = fieldMap[keys[0]];
        }
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = parseFloat(value) || 0;
    }

    /**
     * Change currency and convert all values
     */
    changeCurrency(newCurrency) {
        const oldCurrency = this.data.customerInfo.currency;
        if (oldCurrency === newCurrency) return;
        
        const oldRate = this.exchangeRates[oldCurrency];
        const newRate = this.exchangeRates[newCurrency];
        const conversionFactor = newRate / oldRate;
        
        // Convert customer values and round to 2 decimals
        this.data.customerInfo.totalPaymentValue = Math.round(this.data.customerInfo.totalPaymentValue * conversionFactor * 100) / 100;
        
        // Convert fees and round to 2 decimals
        this.data.fees.tungsten.localRailFee = Math.round(this.data.fees.tungsten.localRailFee * conversionFactor * 100) / 100;
        this.data.fees.tungsten.crossBorderFee = Math.round(this.data.fees.tungsten.crossBorderFee * conversionFactor * 100) / 100;
        this.data.fees.currentProvider.localRailFee = Math.round(this.data.fees.currentProvider.localRailFee * conversionFactor * 100) / 100;
        this.data.fees.currentProvider.crossBorderFee = Math.round(this.data.fees.currentProvider.crossBorderFee * conversionFactor * 100) / 100;
        
        // Update currency
        this.data.customerInfo.currency = newCurrency;
    }

    /**
     * Get currency symbol
     */
    getCurrencySymbol() {
        const symbols = {
            USD: '$',
            GBP: '£',
            EUR: '€'
        };
        return symbols[this.data.customerInfo.currency] || '$';
    }

    /**
     * Calculate average transaction size
     */
    calculateAverageTransactionSize() {
        const total = this.data.customerInfo.totalPaymentValue;
        const count = this.data.customerInfo.totalPaymentCount;
        return count > 0 ? total / count : 0;
    }

    /**
     * Calculate payment volumes and counts
     * CORRECTED LOGIC: Method split (card/rail) comes first, then type split (local/cross-border) applies only to rails
     */
    calculatePaymentBreakdown() {
        const total = this.data.customerInfo.totalPaymentValue;
        const count = this.data.customerInfo.totalPaymentCount;
        const typeDist = this.data.customerInfo.paymentTypeDistribution;
        const methodDist = this.data.customerInfo.paymentMethodDistribution;
        
        // STEP 1: Split by payment method (card vs rail)
        const railValue = total * (methodDist.railPercent / 100);
        const cardValue = total * (methodDist.cardPercent / 100);
        const railCount = Math.round(count * (methodDist.railPercent / 100));
        const cardCount = count - railCount;
        
        // STEP 2: Split RAIL payments by type (local vs cross-border)
        // Cards don't go through rails, so they're excluded from this split
        const localRailValue = railValue * (typeDist.localPercent / 100);
        const crossBorderRailValue = railValue * (typeDist.crossBorderPercent / 100);
        const localRailCount = Math.round(railCount * (typeDist.localPercent / 100));
        const crossBorderRailCount = railCount - localRailCount;
        
        // For display purposes, calculate total local and cross-border (including cards proportionally)
        const localValue = localRailValue + (cardValue * (typeDist.localPercent / 100));
        const crossBorderValue = crossBorderRailValue + (cardValue * (typeDist.crossBorderPercent / 100));
        const localCount = localRailCount + Math.round(cardCount * (typeDist.localPercent / 100));
        const crossBorderCount = crossBorderRailCount + (cardCount - Math.round(cardCount * (typeDist.localPercent / 100)));
        
        return {
            type: {
                local: { value: localValue, count: localCount, percent: typeDist.localPercent },
                crossBorder: { value: crossBorderValue, count: crossBorderCount, percent: typeDist.crossBorderPercent }
            },
            method: {
                rail: { value: railValue, count: railCount, percent: methodDist.railPercent },
                card: { value: cardValue, count: cardCount, percent: methodDist.cardPercent }
            },
            rails: {
                local: { value: localRailValue, count: localRailCount },
                crossBorder: { value: crossBorderRailValue, count: crossBorderRailCount }
            }
        };
    }

    /**
     * Calculate FX volumes by tier
     * FX volume is now derived from cross-border rail payments
     */
    calculateFXVolumes() {
        const breakdown = this.calculatePaymentBreakdown();
        const crossBorderRailValue = breakdown.rails.crossBorder.value;
        const fxPercent = this.data.customerInfo.fxPercentOfCrossBorder || 50;
        
        // FX volume is percentage of cross-border rail payments
        const total = crossBorderRailValue * (fxPercent / 100);
        const dist = this.data.customerInfo.fxVolume.distribution;
        
        return {
            tier1: total * (dist.tier1Percent / 100),
            tier2: total * (dist.tier2Percent / 100),
            tier3: total * (dist.tier3Percent / 100),
            total: total
        };
    }

    /**
     * Calculate costs for a provider
     */
    calculateProviderCosts(provider) {
        const breakdown = this.calculatePaymentBreakdown();
        const fxVolumes = this.calculateFXVolumes();
        const fees = this.data.fees[provider];

        // Rail costs (flat fee per transaction)
        const localRailCost = breakdown.rails.local.count * fees.localRailFee;
        const crossBorderRailCost = breakdown.rails.crossBorder.count * fees.crossBorderFee;
        const totalRailCost = localRailCost + crossBorderRailCost;

        // Card rebate (benefit, not a cost)
        // Higher rebate % = more benefit = more savings
        const cardRebate = breakdown.method.card.value * (fees.cardRebate / 100);

        // FX costs (percentage by tier)
        const fxTier1Cost = fxVolumes.tier1 * (fees.fxMargins.tier1 / 100);
        const fxTier2Cost = fxVolumes.tier2 * (fees.fxMargins.tier2 / 100);
        const fxTier3Cost = fxVolumes.tier3 * (fees.fxMargins.tier3 / 100);
        const fxTotalCost = fxTier1Cost + fxTier2Cost + fxTier3Cost;

        // Total cost (rails + FX only, cards are rebates not costs)
        const totalCost = totalRailCost + fxTotalCost;

        // Metrics
        const totalTransactions = this.data.customerInfo.totalPaymentCount;
        const costPerTransaction = totalTransactions > 0 ? totalCost / totalTransactions : 0;
        const totalVolume = this.data.customerInfo.totalPaymentValue;
        const effectiveRate = totalVolume > 0 ? (totalCost / totalVolume) * 100 : 0;

        return {
            localRail: localRailCost,
            crossBorderRail: crossBorderRailCost,
            rails: totalRailCost,
            cardRebate: cardRebate,
            fx: {
                tier1: fxTier1Cost,
                tier2: fxTier2Cost,
                tier3: fxTier3Cost,
                total: fxTotalCost
            },
            total: totalCost,
            costPerTransaction: costPerTransaction,
            effectiveRate: effectiveRate
        };
    }

    /**
     * Calculate savings - completely separated costs and incentives
     */
    calculateSavings() {
        const currentCosts = this.calculateProviderCosts('currentProvider');
        const tungstenCosts = this.calculateProviderCosts('tungsten');

        // SECTION 1: Transaction cost savings (Rails + FX only)
        const costSavings = {
            localRail: currentCosts.localRail - tungstenCosts.localRail,
            crossBorderRail: currentCosts.crossBorderRail - tungstenCosts.crossBorderRail,
            rails: currentCosts.rails - tungstenCosts.rails,
            fx: currentCosts.fx.total - tungstenCosts.fx.total,
            total: currentCosts.total - tungstenCosts.total  // Rails + FX only
        };

        // SECTION 2: Card incentive differential (completely separate)
        const incentiveDifferential = tungstenCosts.cardRebate - currentCosts.cardRebate;

        // SECTION 3: Total annual benefit = cost savings + incentive differential
        const totalAnnualBenefit = costSavings.total + incentiveDifferential;

        // Calculate percentages
        const costSavingsPercentage = currentCosts.total > 0
            ? (costSavings.total / currentCosts.total) * 100
            : 0;
        
        const incentiveIncreasePercentage = currentCosts.cardRebate > 0
            ? (incentiveDifferential / currentCosts.cardRebate) * 100
            : 0;

        return {
            // Costs (Rails + FX)
            costs: {
                current: currentCosts.total,
                tungsten: tungstenCosts.total,
                savings: costSavings,
                savingsPercentage: costSavingsPercentage
            },
            // Incentives (Card rebates)
            incentives: {
                current: currentCosts.cardRebate,
                tungsten: tungstenCosts.cardRebate,
                differential: incentiveDifferential,
                increasePercentage: incentiveIncreasePercentage
            },
            // Total benefit
            totalAnnualBenefit: totalAnnualBenefit,
            // Keep detailed breakdown for compatibility
            currentCosts,
            tungstenCosts
        };
    }

    /**
     * Calculate freed working capital from card payments
     * Card payments provide 30-day credit terms, freeing up working capital
     */
    calculateFreedWorkingCapital() {
        const breakdown = this.calculatePaymentBreakdown();
        return breakdown.method.card.value; // Card volume = freed capital
    }

    /**
     * Get complete results
     */
    getResults() {
        const breakdown = this.calculatePaymentBreakdown();
        const fxVolumes = this.calculateFXVolumes();
        const savingsData = this.calculateSavings();
        const avgTransactionSize = this.calculateAverageTransactionSize();
        const freedWorkingCapital = this.calculateFreedWorkingCapital();

        return {
            breakdown: breakdown,
            fxVolumes: fxVolumes,
            averageTransactionSize: avgTransactionSize,
            // New structure: completely separated
            costs: savingsData.costs,
            incentives: savingsData.incentives,
            totalAnnualBenefit: savingsData.totalAnnualBenefit,
            freedWorkingCapital: freedWorkingCapital,
            // Keep detailed data for charts
            detailedCosts: {
                current: savingsData.currentCosts,
                tungsten: savingsData.tungstenCosts
            },
            currency: this.data.customerInfo.currency,
            currencySymbol: this.getCurrencySymbol(),
            data: this.data
        };
    }

    /**
     * Adjust FX tier percentages proportionally
     */
    adjustFXTiers(changedTier, newValue) {
        const dist = this.data.customerInfo.fxVolume.distribution;
        const remaining = 100 - newValue;
        
        dist[`tier${changedTier}Percent`] = newValue;
        
        const otherTiers = [1, 2, 3].filter(t => t !== changedTier);
        const tier1 = otherTiers[0];
        const tier2 = otherTiers[1];
        
        const currentTier1 = dist[`tier${tier1}Percent`];
        const currentTier2 = dist[`tier${tier2}Percent`];
        const currentTotal = currentTier1 + currentTier2;
        
        if (currentTotal > 0) {
            dist[`tier${tier1}Percent`] = (currentTier1 / currentTotal) * remaining;
            dist[`tier${tier2}Percent`] = (currentTier2 / currentTotal) * remaining;
        } else {
            dist[`tier${tier1}Percent`] = remaining / 2;
            dist[`tier${tier2}Percent`] = remaining / 2;
        }
        
        const total = dist.tier1Percent + dist.tier2Percent + dist.tier3Percent;
        if (Math.abs(total - 100) > 0.01) {
            dist.tier3Percent += (100 - total);
        }
    }

    /**
     * Validate data
     */
    validate() {
        const errors = [];
        const info = this.data.customerInfo;

        if (info.totalPaymentValue < 0) errors.push('Total payment value must be positive');
        if (info.totalPaymentCount < 0) errors.push('Total payment count must be positive');
        if (info.fxPercentOfCrossBorder < 0 || info.fxPercentOfCrossBorder > 100) {
            errors.push('FX percentage must be between 0 and 100');
        }

        const fxTotal = info.fxVolume.distribution.tier1Percent + 
                       info.fxVolume.distribution.tier2Percent + 
                       info.fxVolume.distribution.tier3Percent;
        if (Math.abs(fxTotal - 100) > 0.01) {
            errors.push('FX distribution must sum to 100%');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Export data
     */
    exportData() {
        return JSON.parse(JSON.stringify(this.data));
    }

    /**
     * Import data
     */
    importData(data) {
        this.data = JSON.parse(JSON.stringify(data));
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.data = this.getDefaultData();
    }
}

/**
 * Utility functions
 */
const FormatUtils = {
    /**
     * Format number with commas
     */
    formatNumberWithCommas(value) {
        if (value === null || value === undefined) return '';
        const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
        if (isNaN(num)) return '';
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    },

    /**
     * Remove commas from string
     */
    removeCommas(value) {
        return String(value).replace(/,/g, '');
    },

    /**
     * Format currency - supports both abbreviated (K/M/B) and comma-separated formats
     */
    formatCurrency(value, decimals = 0, symbol = '$', useCommas = false) {
        if (value === null || value === undefined || isNaN(value)) {
            return `${symbol}0`;
        }
        
        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        
        if (useCommas) {
            // American style with commas
            const formatted = absValue.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            return `${sign}${symbol}${formatted}`;
        } else {
            // Abbreviated format (K, M, B)
            if (absValue >= 1000000000) {
                return `${sign}${symbol}${(absValue / 1000000000).toFixed(2)}B`;
            } else if (absValue >= 1000000) {
                return `${sign}${symbol}${(absValue / 1000000).toFixed(2)}M`;
            } else if (absValue >= 1000) {
                return `${sign}${symbol}${(absValue / 1000).toFixed(2)}K`;
            } else {
                return `${sign}${symbol}${absValue.toFixed(decimals)}`;
            }
        }
    },

    /**
     * Format number
     */
    formatNumber(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Format percentage - Always 2 decimals
     */
    formatPercent(value, decimals = 2) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0.00%';
        }
        return `${value.toFixed(2)}%`;
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
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ROICalculator, FormatUtils };
}