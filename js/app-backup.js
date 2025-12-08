/**
 * Tungsten Pay+ ROI Calculator - Main Application
 * Coordinates all modules and handles user interactions
 */

class TungstenROIApp {
    constructor() {
        this.calculator = new ROICalculator();
        this.chartsManager = new ChartsManager();
        this.storageManager = new StorageManager();
        this.pdfExporter = new PDFExporter();
        
        this.currentTab = 'input';
        this.isCalculating = false;
        
        // Debounced calculation function
        this.debouncedCalculate = FormatUtils.debounce(() => {
            this.calculate();
        }, 300);
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing Tungsten ROI Calculator...');
        
        // Load saved data
        this.loadSavedData();
        
        // Initialize charts
        this.chartsManager.initializeCharts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial calculation
        this.calculate();
        
        // Setup auto-save
        this.setupAutoSave();
        
        console.log('Application initialized successfully');
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        const savedData = this.storageManager.loadCurrentCalculation();
        if (savedData) {
            this.calculator.importData(savedData);
            this.updateAllInputs();
            this.showToast('Previous calculation loaded', 'success');
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Tab navigation
        this.setupTabNavigation();
        
        // Input fields
        this.setupInputListeners();
        
        // Sliders
        this.setupSliderListeners();
        
        // Fee inputs
        this.setupFeeListeners();
        
        // Action buttons
        this.setupActionButtons();
        
        // Window resize
        window.addEventListener('resize', () => {
            this.chartsManager.resizeCharts();
        });
    }

    /**
     * Setup tab navigation
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    /**
     * Switch to a different tab
     */
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-selected', 'true');
        }
        
        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const activePanel = document.getElementById(`${tabName}-panel`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Resize charts when switching to results tab
        if (tabName === 'results') {
            setTimeout(() => {
                this.chartsManager.resizeCharts();
            }, 100);
        }
    }

    /**
     * Setup input field listeners
     */
    setupInputListeners() {
        // Total payment volume
        const totalPaymentInput = document.getElementById('total-payment-volume');
        if (totalPaymentInput) {
            totalPaymentInput.addEventListener('input', (e) => {
                this.calculator.updateCustomerInfo('totalPaymentVolume', e.target.value);
                this.updatePaymentDistribution();
                this.debouncedCalculate();
            });
        }

        // Local transaction count
        const localCountInput = document.getElementById('local-transaction-count');
        if (localCountInput) {
            localCountInput.addEventListener('input', (e) => {
                this.calculator.updateTransactionMetrics('local', 'count', e.target.value);
                this.updatePaymentDistribution();
                this.debouncedCalculate();
            });
        }

        // Local average transaction value
        const localAvgInput = document.getElementById('local-avg-value');
        if (localAvgInput) {
            localAvgInput.addEventListener('input', (e) => {
                this.calculator.updateTransactionMetrics('local', 'averageValue', e.target.value);
                this.updatePaymentDistribution();
                this.debouncedCalculate();
            });
        }

        // Cross-border transaction count
        const crossBorderCountInput = document.getElementById('crossborder-transaction-count');
        if (crossBorderCountInput) {
            crossBorderCountInput.addEventListener('input', (e) => {
                this.calculator.updateTransactionMetrics('crossBorder', 'count', e.target.value);
                this.updatePaymentDistribution();
                this.debouncedCalculate();
            });
        }

        // Cross-border average transaction value
        const crossBorderAvgInput = document.getElementById('crossborder-avg-value');
        if (crossBorderAvgInput) {
            crossBorderAvgInput.addEventListener('input', (e) => {
                this.calculator.updateTransactionMetrics('crossBorder', 'averageValue', e.target.value);
                this.updatePaymentDistribution();
                this.debouncedCalculate();
            });
        }

        // FX volume
        const fxVolumeInput = document.getElementById('fx-volume');
        if (fxVolumeInput) {
            fxVolumeInput.addEventListener('input', (e) => {
                this.calculator.updateCustomerInfo('fxVolume.total', e.target.value);
                this.updateFXDistribution();
                this.debouncedCalculate();
            });
        }

        // Card volume
        const cardVolumeInput = document.getElementById('card-volume');
        if (cardVolumeInput) {
            cardVolumeInput.addEventListener('input', (e) => {
                this.calculator.updateCustomerInfo('cardVolume', e.target.value);
                this.debouncedCalculate();
            });
        }

        // Implementation cost
        const implementationCostInput = document.getElementById('implementation-cost');
        if (implementationCostInput) {
            implementationCostInput.addEventListener('input', (e) => {
                this.calculator.updateCustomerInfo('implementationCost', e.target.value);
                this.debouncedCalculate();
            });
        }
    }

    /**
     * Setup slider listeners
     */
    setupSliderListeners() {
        // Local payment slider
        const localSlider = document.getElementById('local-percent-slider');
        if (localSlider) {
            localSlider.addEventListener('input', (e) => {
                const localPercent = parseFloat(e.target.value);
                this.calculator.updateCustomerInfo('paymentDistribution.localPercent', localPercent);
                this.updatePaymentDistribution();
                this.debouncedCalculate();
            });
        }

        // FX Tier 1 slider
        const fxTier1Slider = document.getElementById('fx-tier1-slider');
        if (fxTier1Slider) {
            fxTier1Slider.addEventListener('input', (e) => {
                const tier1Percent = parseFloat(e.target.value);
                this.calculator.adjustFXTiers(1, tier1Percent);
                this.updateFXDistribution();
                this.updateFXSliderValues();
                this.debouncedCalculate();
            });
        }

        // FX Tier 2 slider
        const fxTier2Slider = document.getElementById('fx-tier2-slider');
        if (fxTier2Slider) {
            fxTier2Slider.addEventListener('input', (e) => {
                const tier2Percent = parseFloat(e.target.value);
                this.calculator.adjustFXTiers(2, tier2Percent);
                this.updateFXDistribution();
                this.updateFXSliderValues();
                this.debouncedCalculate();
            });
        }

        // FX Tier 3 slider
        const fxTier3Slider = document.getElementById('fx-tier3-slider');
        if (fxTier3Slider) {
            fxTier3Slider.addEventListener('input', (e) => {
                const tier3Percent = parseFloat(e.target.value);
                this.calculator.adjustFXTiers(3, tier3Percent);
                this.updateFXDistribution();
                this.updateFXSliderValues();
                this.debouncedCalculate();
            });
        }
    }

    /**
     * Setup fee input listeners
     */
    setupFeeListeners() {
        // Tungsten fees
        const tungstenFeeIds = [
            'tungsten-local-fee',
            'tungsten-crossborder-fee',
            'tungsten-fx-tier1',
            'tungsten-fx-tier2',
            'tungsten-fx-tier3',
            'tungsten-card-fee'
        ];

        const tungstenFeeFields = {
            'tungsten-local-fee': 'localRail',
            'tungsten-crossborder-fee': 'crossBorder',
            'tungsten-fx-tier1': 'fxMargins.tier1',
            'tungsten-fx-tier2': 'fxMargins.tier2',
            'tungsten-fx-tier3': 'fxMargins.tier3',
            'tungsten-card-fee': 'cardInterchange'
        };

        tungstenFeeIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.calculator.updateFee('tungsten', tungstenFeeFields[id], e.target.value);
                    this.debouncedCalculate();
                });
            }
        });

        // Current provider fees
        const currentFeeIds = [
            'current-local-fee',
            'current-crossborder-fee',
            'current-fx-tier1',
            'current-fx-tier2',
            'current-fx-tier3',
            'current-card-fee'
        ];

        const currentFeeFields = {
            'current-local-fee': 'localRail',
            'current-crossborder-fee': 'crossBorder',
            'current-fx-tier1': 'fxMargins.tier1',
            'current-fx-tier2': 'fxMargins.tier2',
            'current-fx-tier3': 'fxMargins.tier3',
            'current-card-fee': 'cardInterchange'
        };

        currentFeeIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.calculator.updateFee('currentProvider', currentFeeFields[id], e.target.value);
                    this.debouncedCalculate();
                });
            }
        });
    }

    /**
     * Setup action button listeners
     */
    setupActionButtons() {
        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCalculation());
        }

        // Load button
        const loadBtn = document.getElementById('load-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.showLoadDialog());
        }

        // Export PDF button
        const exportBtn = document.getElementById('export-pdf-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPDF());
        }
    }


    /**
     * Update payment distribution display
     */
    updatePaymentDistribution() {
        const volumes = this.calculator.calculatePaymentVolumes();
        
        // Update percentages
        document.getElementById('local-percent').textContent = 
            FormatUtils.formatPercent(volumes.localPercent, 0);
        document.getElementById('crossborder-percent').textContent = 
            FormatUtils.formatPercent(volumes.crossBorderPercent, 0);
        
        // Update amounts
        document.getElementById('local-amount').textContent = 
            FormatUtils.formatCurrency(volumes.local, 0);
        document.getElementById('crossborder-amount').textContent = 
            FormatUtils.formatCurrency(volumes.crossBorder, 0);
        
        // Update slider display
        const slider = document.getElementById('local-percent-slider');
        if (slider) {
            const percent = volumes.localPercent;
            slider.style.background = `linear-gradient(to right, #2596be 0%, #2596be ${percent}%, #E5E7EB ${percent}%, #E5E7EB 100%)`;
        }
        
        // Update cross-border display
        const crossBorderDisplay = document.querySelector('.crossborder-display');
        if (crossBorderDisplay) {
            crossBorderDisplay.style.width = `${volumes.crossBorderPercent}%`;
        }
    }

    /**
     * Update FX distribution display
     */
    updateFXDistribution() {
        const fxVolumes = this.calculator.calculateFXVolumes();
        const dist = this.calculator.data.customerInfo.fxVolume.distribution;
        
        // Update Tier 1
        document.getElementById('fx-tier1-percent').textContent = 
            FormatUtils.formatPercent(dist.tier1Percent, 0);
        document.getElementById('fx-tier1-amount').textContent = 
            FormatUtils.formatCurrency(fxVolumes.tier1, 0);
        
        // Update Tier 2
        document.getElementById('fx-tier2-percent').textContent = 
            FormatUtils.formatPercent(dist.tier2Percent, 0);
        document.getElementById('fx-tier2-amount').textContent = 
            FormatUtils.formatCurrency(fxVolumes.tier2, 0);
        
        // Update Tier 3
        document.getElementById('fx-tier3-percent').textContent = 
            FormatUtils.formatPercent(dist.tier3Percent, 0);
        document.getElementById('fx-tier3-amount').textContent = 
            FormatUtils.formatCurrency(fxVolumes.tier3, 0);
        
        // Update slider displays
        const tier1Slider = document.getElementById('fx-tier1-slider');
        if (tier1Slider) {
            tier1Slider.style.background = `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${dist.tier1Percent}%, #E5E7EB ${dist.tier1Percent}%, #E5E7EB 100%)`;
        }
        
        const tier2Slider = document.getElementById('fx-tier2-slider');
        if (tier2Slider) {
            tier2Slider.style.background = `linear-gradient(to right, #EC4899 0%, #EC4899 ${dist.tier2Percent}%, #E5E7EB ${dist.tier2Percent}%, #E5E7EB 100%)`;
        }

        const tier3Slider = document.getElementById('fx-tier3-slider');
        if (tier3Slider) {
            tier3Slider.style.background = `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${dist.tier3Percent}%, #E5E7EB ${dist.tier3Percent}%, #E5E7EB 100%)`;
        }
    }

    /**
     * Update FX slider values to match calculator data
     */
    updateFXSliderValues() {
        const dist = this.calculator.data.customerInfo.fxVolume.distribution;
        
        const tier1Slider = document.getElementById('fx-tier1-slider');
        if (tier1Slider) {
            tier1Slider.value = dist.tier1Percent;
        }
        
        const tier2Slider = document.getElementById('fx-tier2-slider');
        if (tier2Slider) {
            tier2Slider.value = dist.tier2Percent;
        }
        
        const tier3Slider = document.getElementById('fx-tier3-slider');
        if (tier3Slider) {
            tier3Slider.value = dist.tier3Percent;
        }
    }

    /**
     * Update all input fields from calculator data
     */
    updateAllInputs() {
        const data = this.calculator.data;
        
        // Customer info
        document.getElementById('total-payment-volume').value = data.customerInfo.totalPaymentVolume;
        document.getElementById('fx-volume').value = data.customerInfo.fxVolume.total;
        document.getElementById('card-volume').value = data.customerInfo.cardVolume;
        
        // Transaction metrics
        document.getElementById('local-transaction-count').value = data.customerInfo.transactions.local.count;
        document.getElementById('local-avg-value').value = data.customerInfo.transactions.local.averageValue;
        document.getElementById('crossborder-transaction-count').value = data.customerInfo.transactions.crossBorder.count;
        document.getElementById('crossborder-avg-value').value = data.customerInfo.transactions.crossBorder.averageValue;

        // Sliders
        document.getElementById('local-percent-slider').value = data.customerInfo.paymentDistribution.localPercent;
        document.getElementById('fx-tier1-slider').value = data.customerInfo.fxVolume.distribution.tier1Percent;
        document.getElementById('fx-tier2-slider').value = data.customerInfo.fxVolume.distribution.tier2Percent;
        document.getElementById('fx-tier3-slider').value = data.customerInfo.fxVolume.distribution.tier3Percent;
        
        // Tungsten fees
        document.getElementById('tungsten-local-fee').value = data.fees.tungsten.localRail;
        document.getElementById('tungsten-crossborder-fee').value = data.fees.tungsten.crossBorder;
        document.getElementById('tungsten-fx-tier1').value = data.fees.tungsten.fxMargins.tier1;
        document.getElementById('tungsten-fx-tier2').value = data.fees.tungsten.fxMargins.tier2;
        document.getElementById('tungsten-fx-tier3').value = data.fees.tungsten.fxMargins.tier3;
        document.getElementById('tungsten-card-fee').value = data.fees.tungsten.cardInterchange;
        
        // Current provider fees
        document.getElementById('current-local-fee').value = data.fees.currentProvider.localRail;
        document.getElementById('current-crossborder-fee').value = data.fees.currentProvider.crossBorder;
        document.getElementById('current-fx-tier1').value = data.fees.currentProvider.fxMargins.tier1;
        document.getElementById('current-fx-tier2').value = data.fees.currentProvider.fxMargins.tier2;
        document.getElementById('current-fx-tier3').value = data.fees.currentProvider.fxMargins.tier3;
        document.getElementById('current-card-fee').value = data.fees.currentProvider.cardInterchange;
        
        // Update displays
        this.updatePaymentDistribution();
        this.updateFXDistribution();
    }

    /**
     * Perform calculation and update UI
     */
    calculate() {
        if (this.isCalculating) return;
        
        this.isCalculating = true;
        this.showLoading();
        
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                // Validate data
                const validation = this.calculator.validate();
                if (!validation.valid) {
                    this.showToast(validation.errors[0], 'error');
                    this.hideLoading();
                    this.isCalculating = false;
                    return;
                }
                
                // Get results
                const results = this.calculator.getResults();
                
                // Update summary cards
                this.updateSummaryCards(results);
                
                // Update charts
                this.chartsManager.updateCharts(results);
                
                // Store current results
                this.currentResults = results;
                
                this.hideLoading();
                this.isCalculating = false;
            } catch (error) {
                console.error('Calculation error:', error);
                this.showToast('Error performing calculation', 'error');
                this.hideLoading();
                this.isCalculating = false;
            }
        }, 50);
    }

    /**
     * Update summary cards
     */
    updateSummaryCards(results) {
        document.getElementById('current-total-cost').textContent = 
            FormatUtils.formatCurrency(results.costs.current.total, 0);
        document.getElementById('tungsten-total-cost').textContent = 
            FormatUtils.formatCurrency(results.costs.tungsten.total, 0);
        document.getElementById('total-savings').textContent =
            FormatUtils.formatCurrency(results.savings.total, 0);
        document.getElementById('roi-percentage').textContent =
            FormatUtils.formatPercent(results.roi, 1);
        
        // Update time to ROI
        const timeToROI = results.timeToROI;
        let timeToROIText;
        if (timeToROI === 0) {
            timeToROIText = 'Immediate';
        } else if (timeToROI < 1) {
            timeToROIText = '< 1 month';
        } else if (timeToROI < 12) {
            timeToROIText = `${Math.ceil(timeToROI)} months`;
        } else {
            const years = Math.floor(timeToROI / 12);
            const months = Math.ceil(timeToROI % 12);
            if (months === 0) {
                timeToROIText = `${years} ${years === 1 ? 'year' : 'years'}`;
            } else {
                timeToROIText = `${years}y ${months}m`;
            }
        }
        document.getElementById('time-to-roi').textContent = timeToROIText;
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        setInterval(() => {
            this.storageManager.saveCurrentCalculation(this.calculator.exportData());
        }, 30000); // Auto-save every 30 seconds
    }

    /**
     * Save calculation
     */
    saveCalculation() {
        const name = prompt('Enter a name for this calculation:', 
            `Calculation ${new Date().toLocaleDateString()}`);
        
        if (name) {
            const saved = this.storageManager.saveCalculation(name, this.calculator.exportData());
            if (saved) {
                this.showToast('Calculation saved successfully', 'success');
            } else {
                this.showToast('Error saving calculation', 'error');
            }
        }
    }

    /**
     * Show load dialog
     */
    showLoadDialog() {
        const calculations = this.storageManager.getSavedCalculations();
        
        if (calculations.length === 0) {
            this.showToast('No saved calculations found', 'warning');
            return;
        }
        
        let message = 'Select a calculation to load:\n\n';
        calculations.forEach((calc, index) => {
            message += `${index + 1}. ${calc.name} (${new Date(calc.updatedAt).toLocaleDateString()})\n`;
        });
        
        const selection = prompt(message + '\nEnter number:');
        
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < calculations.length) {
                const data = this.storageManager.loadCalculation(calculations[index].id);
                if (data) {
                    this.calculator.importData(data);
                    this.updateAllInputs();
                    this.calculate();
                    this.showToast('Calculation loaded successfully', 'success');
                }
            }
        }
    }

    /**
     * Export to PDF
     */
    async exportPDF() {
        if (!this.currentResults) {
            this.showToast('Please calculate results first', 'warning');
            return;
        }
        
        this.showLoading('Generating PDF...');
        
        try {
            await this.pdfExporter.generatePDF(this.currentResults);
            this.showToast('PDF exported successfully', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            this.showToast('Error exporting PDF', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(text = 'Calculating...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.querySelector('.loading-text');
        if (overlay) {
            if (loadingText) {
                loadingText.textContent = text;
            }
            overlay.classList.add('active');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.2s ease-out';
            setTimeout(() => {
                container.removeChild(toast);
            }, 200);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TungstenROIApp();
    window.app.init();
});