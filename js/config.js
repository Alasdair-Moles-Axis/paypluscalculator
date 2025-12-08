/**
 * Tungsten Pay+ Payments Optimisation Analysis - Configuration
 * Central configuration for admin settings, labels, and constants
 */

const CONFIG = {
    // Value Driver Explanations (Threshold-Based)
    // Customize messages based on savings percentage ranges
    valueDrivers: {
        localRail: {
            thresholds: [
                { min: 0, max: 20, message: 'Savings through Pay+ local payment routing optimization' },
                { min: 20, max: 50, message: 'Significant savings through Pay+ optimized payment processing' },
                { min: 50, max: 100, message: 'Exceptional savings from leveraging Pay+ payment processing economics' }
            ],
            noSavings: 'No savings in this category'
        },
        crossBorder: {
            thresholds: [
                { min: 0, max: 20, message: 'Initial cross-border payment optimization with competitive rates' },
                { min: 20, max: 50, message: 'Savings through strong Pay+ cross-border processing efficiency' },
                { min: 50, max: 100, message: 'Savings through market-leading Pay+ cross-border processing efficiency' }
            ],
            noSavings: 'No savings in this category'
        },
        fx: {
            thresholds: [
                { min: 0, max: 20, message: 'Competitive Pay+ FX margins providing baseline savings across tiers' },
                { min: 20, max: 50, message: 'Excellent Pay+ FX pricing with substantial margin improvements' },
                { min: 50, max: 100, message: 'Industry-leading FX rates delivering maximum savings leveraging Pay+ global network' }
            ],
            noSavings: 'No savings in this category'
        },
        cards: {
            thresholds: [
                { min: 0, max: 20, message: 'Improved card rebate rates through optimized processing' },
                { min: 20, max: 50, message: 'Significant card processing savings via enhanced rebate agreements' },
                { min: 50, max: 100, message: 'Exceptional card rebate value with best-in-class rates and processing' }
            ],
            noSavings: 'No savings in this category'
        }
    },
    
    // PDF Logo Configuration
    // To add logos: Convert your PNG files to base64 and paste here
    // You can use: https://www.base64-image.de/ or any base64 converter
    // Leave as null to skip logos
    pdfLogos: {
        payPlusLogo: null,  // Base64 string for Pay+ logo (top right)
        tungstenLogo: null  // Base64 string for Tungsten logo (bottom center)
    },
    
    // PDF Text Configuration
    // Edit all text that appears in the PDF export
    pdfText: {
        // Header
        title: 'Tungsten Pay+',
        subtitle: 'Payments optimisation analysis',
        
        // Placeholder Text Section
        placeholderText: 'Pay+ seamlessly enables the completion of the invoice-to-pay lifecycle through modern payments orchestration for flexibility and economical transactions.',
        
        // Key Facts Section
        keyFactsTitle: 'What you have told us',
        keyFactsLabels: {
            currency: 'Base currency',
            totalPaymentVolume: 'Annual payment value',
            annualPayments: 'Annual payment volume',
            railPayments: 'Bank payments',
            cardPayments: 'Card payments',
            localRail: 'Local payments',
            crossBorderRail: 'Cross-border payments',
            fxPercentOfCrossBorder: '% Cross-border requiring FX',
            currentLocalPaymentFee: 'Current local payment fee',
            currentCrossBorderPaymentFee: 'Current cross-border payment fee',
            currentFxMarginTier1: 'Current FX margin (0-100k)',
            currentFxMarginTier2: 'Current FX margin (100k-500k)',
            currentFxMarginTier3: 'Current FX margin (>500k)',
            currentCardRebate: 'Current card rebate',
            currentAnnualCost: 'Current annual cost',
            tungstenAnnualCost: 'Tungsten annual cost'
        },
        
        // Savings Summary Section
        savingsSummaryTitle: 'Annual transaction savings',
        savingsSummaryLabel: 'You save annually',
        savingsSummaryPercentSuffix: 'savings on transaction costs',
        
        // Savings Breakdown Table
        savingsBreakdownTitle: 'Savings Breakdown',
        tableHeaders: {
            paymentType: 'Payment Type',
            currentCost: 'Current Cost',
            percentSavings: '% Savings',
            valueDriver: 'Value Driver'
        },
        paymentTypeLabels: {
            localRail: 'Local Rail',
            crossBorder: 'Cross-Border',
            fx: 'FX',
            cards: 'Cards',
            total: 'TOTAL'
        },
        
        // Footer
        footerTitle: 'Tungsten Pay+ Payments Optimisation Analysis',
        footerDisclaimer: 'This analysis is for informational purposes only. Actual savings may vary based on transaction volumes and patterns.'
    },
    
    // Tungsten Brand Colors
    colors: {
        primary: '#002854',        // Prussian Blue - Tungsten brand color
        primaryLight: '#003d7a',   // Lighter shade for hover states
        primaryDark: '#001a3d',    // Darker shade
        secondary: '#E5E7EB',      // Light gray for backgrounds
        success: '#10B981',        // Green for savings
        warning: '#F59E0B',        // Amber for warnings
        error: '#EF4444'           // Red for errors
    },
    
    // Default Tungsten Fees (hidden from users, only in admin menu)
    defaultTungstenFees: {
        localRailFee: 0.15,
        crossBorderFee: 15.00,
        fxMargins: {
            tier1: 0.50,
            tier2: 0.40,
            tier3: 0.35
        },
        cardRebate: 1.50
    },
    
    // UI Labels (configurable for easy updates)
    labels: {
        paymentGeography: 'Payment Geography',
        paymentGeographyDescription: 'Split your payments by geography (cards are excluded)',
        fxPaymentShare: 'FX Percentage of Cross-Border',
        fxPaymentShareDescription: 'What percentage of your cross-border payments require foreign exchange?'
    },
    
    // Application Settings
    app: {
        autoSaveInterval: 30000,  // 30 seconds
        calculationDebounce: 800, // 800ms (increased to reduce popup frequency)
        version: '5.0'
    }
};

// Also export as AppConfig for backwards compatibility
const AppConfig = CONFIG;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}