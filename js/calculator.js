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
                
                // FX is percentage of cross-border rail payments
                fxPercentOfCrossBorder: 50,

                // WACC (Weighted Average Cost of Capital) as percentage
                wacc: 8.0
            },
            fees: {
                tungsten: {
                    localRailFee: 0.50,
                    crossBorderFee: 2.00,
                    fxMargin: 0.35,
                    cardRebate: 1.50
                },
                currentProvider: {
                    localRailFee: 1.00,
                    crossBorderFee: 3.50,
                    fxMargin: 0.60,
                    cardRebate: 1.00
                }
            },
            // Internal processing costs (admin-only, for margin calculation)
            costs: {
                tungsten: {
                    directToClient: {
                        localRailCost: 0.05,
                        crossBorderCost: 0.80,
                        fxCostPercent: 0.10
                    },
                    partner: {
                        localRailCost: 0.08,
                        crossBorderCost: 1.00,
                        fxCostPercent: 0.12
                    }
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
     * Update internal processing cost
     * @param {string} channel - 'directToClient' or 'partner'
     * @param {string} field - cost field name
     * @param {number} value - new value
     */
    updateCost(channel, field, value) {
        if (!this.data.costs) this.data.costs = this.getDefaultData().costs;
        if (!this.data.costs.tungsten) this.data.costs.tungsten = this.getDefaultData().costs.tungsten;
        if (!this.data.costs.tungsten[channel]) this.data.costs.tungsten[channel] = this.getDefaultData().costs.tungsten[channel];
        this.data.costs.tungsten[channel][field] = parseFloat(value) || 0;
    }

    /**
     * Calculate Tungsten's margin (fee minus internal cost) per payment type
     * @param {string} channel - 'directToClient' or 'partner'
     * @returns {Object} Per-type and total margin
     */
    calculateTungstenMargin(channel = 'directToClient') {
        const breakdown = this.calculatePaymentBreakdown();
        const fxVolume = this.calculateFXVolume();
        const fees = this.data.fees.tungsten;
        const defaults = this.getDefaultData().costs.tungsten[channel];
        const costs = (this.data.costs && this.data.costs.tungsten && this.data.costs.tungsten[channel]) || defaults;

        // Local rail margin = (fee - cost) * transaction count
        const localRailRevenue = breakdown.rails.local.count * fees.localRailFee;
        const localRailCost = breakdown.rails.local.count * costs.localRailCost;
        const localRailMargin = localRailRevenue - localRailCost;

        // Cross-border margin = (fee - cost) * transaction count
        const crossBorderRevenue = breakdown.rails.crossBorder.count * fees.crossBorderFee;
        const crossBorderCost = breakdown.rails.crossBorder.count * costs.crossBorderCost;
        const crossBorderMargin = crossBorderRevenue - crossBorderCost;

        // FX margin = (fxMargin% - fxCost%) * fxVolume
        const fxRevenue = fxVolume * (fees.fxMargin / 100);
        const fxCost = fxVolume * (costs.fxCostPercent / 100);
        const fxMargin = fxRevenue - fxCost;

        const totalMargin = localRailMargin + crossBorderMargin + fxMargin;

        return {
            localRail: { revenue: localRailRevenue, cost: localRailCost, margin: localRailMargin },
            crossBorder: { revenue: crossBorderRevenue, cost: crossBorderCost, margin: crossBorderMargin },
            fx: { revenue: fxRevenue, cost: fxCost, margin: fxMargin },
            totalMargin,
            // Per-unit margins (for admin display)
            perUnit: {
                localRailMargin: fees.localRailFee - costs.localRailCost,
                crossBorderMargin: fees.crossBorderFee - costs.crossBorderCost,
                fxMarginPercent: fees.fxMargin - costs.fxCostPercent
            }
        };
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

        // Convert fees (flat amounts only, not percentages)
        this.data.fees.tungsten.localRailFee = Math.round(this.data.fees.tungsten.localRailFee * conversionFactor * 100) / 100;
        this.data.fees.tungsten.crossBorderFee = Math.round(this.data.fees.tungsten.crossBorderFee * conversionFactor * 100) / 100;
        this.data.fees.currentProvider.localRailFee = Math.round(this.data.fees.currentProvider.localRailFee * conversionFactor * 100) / 100;
        this.data.fees.currentProvider.crossBorderFee = Math.round(this.data.fees.currentProvider.crossBorderFee * conversionFactor * 100) / 100;

        // Convert internal costs (flat amounts only, not percentages)
        for (const channel of ['directToClient', 'partner']) {
            const costs = this.data.costs.tungsten[channel];
            costs.localRailCost = Math.round(costs.localRailCost * conversionFactor * 100) / 100;
            costs.crossBorderCost = Math.round(costs.crossBorderCost * conversionFactor * 100) / 100;
            // fxCostPercent stays as-is (it's a percentage)
        }

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
     * Calculate FX volume (single band - percentage of cross-border rail payments)
     */
    calculateFXVolume() {
        const breakdown = this.calculatePaymentBreakdown();
        const crossBorderRailValue = breakdown.rails.crossBorder.value;
        const fxPercent = this.data.customerInfo.fxPercentOfCrossBorder || 50;
        return crossBorderRailValue * (fxPercent / 100);
    }

    /**
     * Calculate costs for a provider
     */
    calculateProviderCosts(provider) {
        const breakdown = this.calculatePaymentBreakdown();
        const fxVolume = this.calculateFXVolume();
        const fees = this.data.fees[provider];

        // Rail costs (flat fee per transaction)
        const localRailCost = breakdown.rails.local.count * fees.localRailFee;
        const crossBorderRailCost = breakdown.rails.crossBorder.count * fees.crossBorderFee;
        const totalRailCost = localRailCost + crossBorderRailCost;

        // Card rebate (benefit, not a cost)
        const cardRebate = breakdown.method.card.value * (fees.cardRebate / 100);

        // FX cost (single margin applied to total FX volume)
        const fxCost = fxVolume * (fees.fxMargin / 100);

        // Total cost (rails + FX only, cards are rebates not costs)
        const totalCost = totalRailCost + fxCost;

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
                total: fxCost
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
     * Calculate annual value of freed working capital using WACC
     * Formula: Freed Capital × WACC%
     */
    calculateWACCValue() {
        const freedCapital = this.calculateFreedWorkingCapital();
        const wacc = this.data.customerInfo.wacc || 0;
        return freedCapital * (wacc / 100);
    }

    /**
     * Calculate cumulative ROI timeline (month-by-month)
     */
    calculateCumulativeROI(options = {}) {
        const periods = options.periods || (typeof CONFIG !== 'undefined' ? CONFIG.cumulativeROI.periods : 12);
        const implementationCost = options.implementationCost || 0;
        const monthlySubscription = options.monthlySubscription || 0;
        const rampUpMonths = options.rampUpMonths != null ? options.rampUpMonths : (typeof CONFIG !== 'undefined' ? CONFIG.cumulativeROI.rampUpMonths : 2);
        const annualGrowthRate = options.volumeGrowthRate || 0;
        const monthlyGrowthRate = annualGrowthRate > 0 ? Math.pow(1 + annualGrowthRate / 100, 1/12) - 1 : 0;

        const savingsData = this.calculateSavings();
        const baseMonthlyBenefit = savingsData.totalAnnualBenefit / 12;

        const timeline = [];
        let cumulativeSavings = 0;
        let breakEvenPeriod = null;

        for (let i = 1; i <= periods; i++) {
            // Volume growth factor (compounding monthly)
            const growthFactor = monthlyGrowthRate > 0 ? Math.pow(1 + monthlyGrowthRate, i - 1) : 1;

            // Linear ramp-up factor
            let rampFactor = 1;
            if (rampUpMonths > 0 && i <= rampUpMonths) {
                rampFactor = i / (rampUpMonths + 1);
            }

            const grossSavings = baseMonthlyBenefit * rampFactor * growthFactor;
            const savingsThisPeriod = grossSavings - monthlySubscription;
            cumulativeSavings += savingsThisPeriod;
            const netPosition = cumulativeSavings - implementationCost;

            if (breakEvenPeriod === null && netPosition >= 0) {
                breakEvenPeriod = i;
            }

            timeline.push({
                period: i,
                periodLabel: `Month ${i}`,
                savingsThisPeriod: savingsThisPeriod,
                cumulativeSavings: cumulativeSavings,
                netPosition: netPosition
            });
        }

        return {
            timeline: timeline,
            breakEvenPeriod: breakEvenPeriod,
            totalCumulativeSavings: cumulativeSavings,
            monthlyBenefitAtScale: baseMonthlyBenefit,
            implementationCost: implementationCost,
            monthlySubscription: monthlySubscription,
            volumeGrowthRate: annualGrowthRate
        };
    }

    /**
     * Calculate partner upside based on Tungsten's MARGIN (not total fee)
     * Revenue share = percentage of margin, not percentage of fee charged to customer
     */
    calculatePartnerUpside(partnerConfig) {
        if (!partnerConfig) return {
            spiff: { enabled: false, value: 0 },
            bulkBuy: { enabled: false, annualMarginShare: 0, upfrontCost: 0 },
            revenueShare: { enabled: false, value: 0 },
            totalAnnualUpside: 0
        };

        const margin = this.calculateTungstenMargin('partner');
        const result = {
            spiff: { enabled: false, value: 0 },
            bulkBuy: { enabled: false, annualMarginShare: 0, upfrontCost: 0, numberOfLicenses: 0 },
            revenueShare: { enabled: false, value: 0 },
            totalAnnualUpside: 0
        };

        // SPIFF: one-time bonus per deal
        if (partnerConfig.spiff && partnerConfig.spiff.enabled) {
            result.spiff = {
                enabled: true,
                value: partnerConfig.spiff.amountPerDeal || 0
            };
        }

        // Bulk Buy: partner purchases licenses upfront, earns margin share with ramp-up
        if (partnerConfig.bulkBuy && partnerConfig.bulkBuy.enabled) {
            const licenses = partnerConfig.bulkBuy.numberOfLicenses || 0;
            const costPerLicense = partnerConfig.bulkBuy.costPerLicense || 0;
            const upfrontCost = licenses * costPerLicense;
            const marginSharePct = partnerConfig.bulkBuy.marginSharePercent || 0;
            const rampSchedule = partnerConfig.bulkBuy.rampUpSchedule || [licenses];

            // Calculate utilization: average active licenses across 4 quarters / total licenses
            const quarters = rampSchedule.slice(0, 4);
            // Clamp each quarter to max licenses
            const clampedQuarters = quarters.map(q => Math.min(q, licenses));
            const avgActive = clampedQuarters.length > 0
                ? clampedQuarters.reduce((a, b) => a + b, 0) / clampedQuarters.length
                : 0;
            const utilizationRate = licenses > 0 ? avgActive / licenses : 0;

            // Annual margin share weighted by utilization
            const annualMarginShare = margin.totalMargin * (marginSharePct / 100) * utilizationRate;

            // ROI and payback
            const roiPercent = upfrontCost > 0 ? ((annualMarginShare / upfrontCost) * 100) : 0;
            const paybackMonths = annualMarginShare > 0 ? Math.ceil(upfrontCost / (annualMarginShare / 12)) : null;

            result.bulkBuy = {
                enabled: true,
                numberOfLicenses: licenses,
                costPerLicense: costPerLicense,
                upfrontCost: upfrontCost,
                annualMarginShare: annualMarginShare,
                avgActiveLicenses: avgActive,
                utilizationRate: utilizationRate,
                roiPercent: roiPercent,
                paybackMonths: paybackMonths,
                rampUpSchedule: clampedQuarters,
                // Per-type breakdown (for reseller PDF, shows earnings not margins)
                breakdown: {
                    localRail: margin.localRail.margin * (marginSharePct / 100) * utilizationRate,
                    crossBorder: margin.crossBorder.margin * (marginSharePct / 100) * utilizationRate,
                    fx: margin.fx.margin * (marginSharePct / 100) * utilizationRate
                }
            };
        }

        // Standard Revenue Share: percentage of Tungsten's margin (no upfront cost)
        if (partnerConfig.revenueShare && partnerConfig.revenueShare.enabled) {
            const pct = partnerConfig.revenueShare.percentage || 0;
            result.revenueShare = {
                enabled: true,
                value: margin.totalMargin * (pct / 100),
                // Per-type breakdown (for reseller PDF)
                breakdown: {
                    localRail: margin.localRail.margin * (pct / 100),
                    crossBorder: margin.crossBorder.margin * (pct / 100),
                    fx: margin.fx.margin * (pct / 100)
                }
            };
        }

        // Total annual upside = bulk buy margin share + standard rev share
        // (SPIFF is one-time, shown separately)
        result.totalAnnualUpside = (result.bulkBuy.annualMarginShare || 0) + (result.revenueShare.value || 0);

        return result;
    }

    /**
     * Get complete results with optional extensions
     */
    getResults(options = {}) {
        const breakdown = this.calculatePaymentBreakdown();
        const fxVolume = this.calculateFXVolume();
        const savingsData = this.calculateSavings();
        const avgTransactionSize = this.calculateAverageTransactionSize();
        const freedWorkingCapital = this.calculateFreedWorkingCapital();
        const waccValue = this.calculateWACCValue();

        const results = {
            breakdown: breakdown,
            fxVolume: fxVolume,
            averageTransactionSize: avgTransactionSize,
            costs: savingsData.costs,
            incentives: savingsData.incentives,
            totalAnnualBenefit: savingsData.totalAnnualBenefit,
            freedWorkingCapital: freedWorkingCapital,
            waccValue: waccValue,
            wacc: this.data.customerInfo.wacc,
            detailedCosts: {
                current: savingsData.currentCosts,
                tungsten: savingsData.tungstenCosts
            },
            currency: this.data.customerInfo.currency,
            currencySymbol: this.getCurrencySymbol(),
            data: this.data
        };

        // Optional: Include cumulative ROI data
        if (options.includeCumulativeROI) {
            results.cumulativeROI = this.calculateCumulativeROI(options.cumulativeROIOptions || {});
        }

        // Optional: Include partner upside data
        if (options.includePartnerUpside && options.partnerConfig) {
            results.partnerUpside = this.calculatePartnerUpside(options.partnerConfig);
            // Include margin details for admin display (NEVER for partner-facing output)
            if (options.includeMarginDetails) {
                results.marginDetails = {
                    directToClient: this.calculateTungstenMargin('directToClient'),
                    partner: this.calculateTungstenMargin('partner')
                };
            }
        }

        return results;
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
     * Import data (merges with defaults to handle schema migrations)
     */
    importData(data) {
        const imported = JSON.parse(JSON.stringify(data));
        const defaults = this.getDefaultData();
        // Ensure costs structure exists (added in margin update)
        if (!imported.costs) {
            imported.costs = defaults.costs;
        } else if (!imported.costs.tungsten) {
            imported.costs.tungsten = defaults.costs.tungsten;
        } else {
            if (!imported.costs.tungsten.directToClient) imported.costs.tungsten.directToClient = defaults.costs.tungsten.directToClient;
            if (!imported.costs.tungsten.partner) imported.costs.tungsten.partner = defaults.costs.tungsten.partner;
        }
        this.data = imported;
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