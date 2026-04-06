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
        this.calculatorMode = 'direct-to-client'; // or 'partner-reseller'
        this.partnerConfig = null;
        this.implementationCosts = { setupFee: 0, integrationFee: 0, trainingFee: 0 };
        this.monthlySubscription = 0;
        this.rampUpMonths = 2;
        this.volumeGrowthRate = 0;

        // Debounced calculation function - Increased to 800ms to reduce popup frequency
        this.debouncedCalculate = FormatUtils.debounce(() => {
            this.calculate();
        }, 800);
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing Tungsten ROI Calculator...');

        // Load saved data
        this.loadSavedData();

        // Load calculator mode and partner config
        this.calculatorMode = this.storageManager.getCalculatorMode();
        this.partnerConfig = this.storageManager.getPartnerConfig();

        // Initialize charts
        this.chartsManager.initializeCharts();
        this.chartsManager.createCumulativeROIChart();

        // Setup event listeners
        this.setupEventListeners();

        // Setup logo triple-click toggle
        this.setupLogoToggle();

        // Setup mode toggle, partner config, and implementation costs
        this.setupModeToggle();
        this.setupPartnerConfigListeners();
        this.setupImplementationCostListeners();
        this.loadImplementationCosts();
        this.setupROIProjectionListeners();
        this.loadROIProjectionSettings();

        // Apply saved mode
        this.applyCalculatorMode();

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
        
        // Editable percentages
        this.setupEditablePercentages();
        
        // Settings toggle
        this.setupSettingsToggle();
    }

    /**
     * Setup password-protected logo toggle for Tungsten settings
     */
    /**
     * Hash a string using SHA-256 via Web Crypto API
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    setupLogoToggle() {
        const logo = document.querySelector('.app-logo');
        const settingsSection = document.getElementById('tungsten-settings');

        if (!logo || !settingsSection) return;

        let clickCount = 0;
        let clickTimer = null;

        logo.addEventListener('click', async (e) => {
            clickCount++;

            if (clickTimer) {
                clearTimeout(clickTimer);
            }

            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 500);

            if (clickCount === 3) {
                clickCount = 0;
                clearTimeout(clickTimer);

                const isHidden = settingsSection.classList.contains('hidden');

                if (isHidden) {
                    const password = prompt('Enter admin password:');

                    if (password !== null) {
                        const hash = await this.hashPassword(password);
                        const expectedHash = (typeof CONFIG !== 'undefined' && CONFIG.adminPasswordHash)
                            ? CONFIG.adminPasswordHash
                            : '68bbe93c254e042ca6b001a3c364d996b0d0c44125a0be5caa5bb651a5c85e16';

                        if (hash === expectedHash) {
                            settingsSection.classList.remove('hidden');
                            settingsSection.classList.add('visible');
                            this.showToast('Admin settings unlocked', 'success');
                            localStorage.setItem('tungstenSettingsVisible', 'true');
                        } else {
                            this.showToast('Incorrect password', 'error');
                        }
                    }
                } else {
                    settingsSection.classList.add('hidden');
                    settingsSection.classList.remove('visible');
                    this.showToast('Admin settings hidden', 'success');
                    localStorage.setItem('tungstenSettingsVisible', 'false');
                }
            }
        });

        // Restore state from localStorage
        const savedState = localStorage.getItem('tungstenSettingsVisible');
        if (savedState === 'true') {
            settingsSection.classList.remove('hidden');
            settingsSection.classList.add('visible');
        }
    }

    /**
     * Setup calculator mode toggle
     */
    setupModeToggle() {
        const modeButtons = document.querySelectorAll('#mode-toggle .mode-toggle-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.setCalculatorMode(mode);
            });
        });
    }

    /**
     * Set calculator mode and update UI
     */
    setCalculatorMode(mode) {
        this.calculatorMode = mode;
        this.storageManager.setCalculatorMode(mode);
        this.applyCalculatorMode();
        this.calculate();
        this.showToast(`Switched to ${mode === 'direct-to-client' ? 'Direct to Client' : 'Partner Reseller'} mode`, 'success');
    }

    /**
     * Apply calculator mode to UI
     */
    applyCalculatorMode() {
        const mode = this.calculatorMode;

        // Update toggle buttons
        document.querySelectorAll('#mode-toggle .mode-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide partner config panel
        const partnerPanel = document.getElementById('partner-config-panel');
        if (partnerPanel) {
            partnerPanel.classList.toggle('hidden', mode !== 'partner-reseller');
        }

        // Show/hide partner upside section in results
        const partnerUpside = document.getElementById('partner-upside-section');
        if (partnerUpside) {
            partnerUpside.classList.toggle('hidden', mode !== 'partner-reseller');
        }

        // Show/hide cumulative ROI section
        const cumulativeROI = document.getElementById('cumulative-roi-section');
        if (cumulativeROI) {
            cumulativeROI.classList.toggle('hidden', mode !== 'direct-to-client');
        }

        // Restore partner config values to inputs if in partner mode
        if (mode === 'partner-reseller' && this.partnerConfig) {
            this.restorePartnerConfigInputs();
        }
    }

    /**
     * Restore partner config values to form inputs
     */
    restorePartnerConfigInputs() {
        const config = this.partnerConfig;
        if (!config) return;

        const spiffEnabled = document.getElementById('spiff-enabled');
        if (spiffEnabled) spiffEnabled.checked = config.spiff?.enabled || false;
        const spiffAmount = document.getElementById('spiff-amount');
        if (spiffAmount) spiffAmount.value = config.spiff?.amountPerDeal || 500;
        this.toggleMechanismConfig('spiff-enabled', 'spiff-config');

        const bulkEnabled = document.getElementById('bulk-buy-enabled');
        if (bulkEnabled) bulkEnabled.checked = config.bulkBuy?.enabled || false;
        const bulkUpfront = document.getElementById('bulk-buy-upfront-cost');
        if (bulkUpfront) bulkUpfront.value = config.bulkBuy?.upfrontCost || 10000;
        const bulkRevShare = document.getElementById('bulk-buy-rev-share');
        if (bulkRevShare) bulkRevShare.value = config.bulkBuy?.enhancedRevShare || 20;
        this.toggleMechanismConfig('bulk-buy-enabled', 'bulk-buy-config');

        const revEnabled = document.getElementById('revenue-share-enabled');
        if (revEnabled) revEnabled.checked = config.revenueShare?.enabled || false;
        const revPercent = document.getElementById('revenue-share-percent');
        if (revPercent) revPercent.value = config.revenueShare?.percentage || 10;
        this.toggleMechanismConfig('revenue-share-enabled', 'revenue-share-config');
    }

    /**
     * Toggle mechanism config visibility
     */
    toggleMechanismConfig(checkboxId, configId) {
        const checkbox = document.getElementById(checkboxId);
        const config = document.getElementById(configId);
        if (checkbox && config) {
            config.classList.toggle('hidden', !checkbox.checked);
        }
    }

    /**
     * Setup partner config listeners
     */
    setupPartnerConfigListeners() {
        // Mechanism checkboxes
        const mechanisms = [
            { checkbox: 'spiff-enabled', config: 'spiff-config' },
            { checkbox: 'bulk-buy-enabled', config: 'bulk-buy-config' },
            { checkbox: 'revenue-share-enabled', config: 'revenue-share-config' }
        ];

        mechanisms.forEach(({ checkbox, config }) => {
            const el = document.getElementById(checkbox);
            if (el) {
                el.addEventListener('change', () => {
                    this.toggleMechanismConfig(checkbox, config);
                    this.updatePartnerConfig();
                    this.debouncedCalculate();
                });
            }
        });

        // All partner config inputs
        const partnerInputIds = [
            'spiff-amount', 'bulk-buy-upfront-cost', 'bulk-buy-rev-share',
            'revenue-share-percent'
        ];

        partnerInputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    this.updatePartnerConfig();
                    this.debouncedCalculate();
                });
            }
        });
    }

    /**
     * Read partner config from form inputs and save
     */
    updatePartnerConfig() {
        this.partnerConfig = {
            spiff: {
                enabled: document.getElementById('spiff-enabled')?.checked || false,
                amountPerDeal: parseFloat(document.getElementById('spiff-amount')?.value) || 0
            },
            bulkBuy: {
                enabled: document.getElementById('bulk-buy-enabled')?.checked || false,
                upfrontCost: parseFloat(document.getElementById('bulk-buy-upfront-cost')?.value) || 0,
                enhancedRevShare: parseFloat(document.getElementById('bulk-buy-rev-share')?.value) || 0
            },
            revenueShare: {
                enabled: document.getElementById('revenue-share-enabled')?.checked || false,
                percentage: parseFloat(document.getElementById('revenue-share-percent')?.value) || 0
            }
        };
        this.storageManager.setPartnerConfig(this.partnerConfig);
    }

    /**
     * Setup implementation cost listeners
     */
    setupImplementationCostListeners() {
        ['impl-setup-fee', 'impl-integration-fee', 'impl-training-fee', 'subscription-monthly'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    this.updateCostSettings();
                    this.debouncedCalculate();
                });
            }
        });
    }

    /**
     * Load cost settings from localStorage
     */
    loadImplementationCosts() {
        try {
            const stored = localStorage.getItem('costSettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.implementationCosts = { setupFee: parsed.setupFee || 0, integrationFee: parsed.integrationFee || 0, trainingFee: parsed.trainingFee || 0 };
                this.monthlySubscription = parsed.monthlySubscription || 0;
            }
        } catch (e) { /* use defaults */ }

        const setupFee = document.getElementById('impl-setup-fee');
        if (setupFee) setupFee.value = this.implementationCosts.setupFee || 0;
        const intFee = document.getElementById('impl-integration-fee');
        if (intFee) intFee.value = this.implementationCosts.integrationFee || 0;
        const trainFee = document.getElementById('impl-training-fee');
        if (trainFee) trainFee.value = this.implementationCosts.trainingFee || 0;
        const subEl = document.getElementById('subscription-monthly');
        if (subEl) subEl.value = this.monthlySubscription || 0;

        this.updateCostDisplays();
    }

    /**
     * Read cost settings from form and save
     */
    updateCostSettings() {
        this.implementationCosts = {
            setupFee: parseFloat(document.getElementById('impl-setup-fee')?.value) || 0,
            integrationFee: parseFloat(document.getElementById('impl-integration-fee')?.value) || 0,
            trainingFee: parseFloat(document.getElementById('impl-training-fee')?.value) || 0
        };
        this.monthlySubscription = parseFloat(document.getElementById('subscription-monthly')?.value) || 0;
        try {
            localStorage.setItem('costSettings', JSON.stringify({
                ...this.implementationCosts,
                monthlySubscription: this.monthlySubscription
            }));
        } catch (e) { /* ignore */ }
        this.updateCostDisplays();
    }

    /**
     * Update cost display fields
     */
    updateCostDisplays() {
        const sym = this.calculator.getCurrencySymbol();
        const implTotal = (this.implementationCosts.setupFee || 0)
            + (this.implementationCosts.integrationFee || 0)
            + (this.implementationCosts.trainingFee || 0);
        const implEl = document.getElementById('impl-total-cost');
        if (implEl) implEl.textContent = FormatUtils.formatCurrency(implTotal, 0, sym, true);
        const subAnnualEl = document.getElementById('subscription-annual');
        if (subAnnualEl) subAnnualEl.textContent = FormatUtils.formatCurrency(this.monthlySubscription * 12, 0, sym, true);
    }

    /**
     * Get total one-off implementation cost
     */
    getTotalImplementationCost() {
        return (this.implementationCosts.setupFee || 0)
            + (this.implementationCosts.integrationFee || 0)
            + (this.implementationCosts.trainingFee || 0);
    }

    /**
     * Setup ROI projection settings listeners (ramp-up + growth rate)
     */
    setupROIProjectionListeners() {
        const rampUpEl = document.getElementById('ramp-up-months');
        if (rampUpEl) {
            rampUpEl.addEventListener('input', () => {
                this.rampUpMonths = parseInt(rampUpEl.value) || 0;
                this.saveROIProjectionSettings();
                this.debouncedCalculate();
            });
        }

        const growthEl = document.getElementById('volume-growth-rate');
        if (growthEl) {
            growthEl.addEventListener('input', () => {
                this.volumeGrowthRate = parseFloat(growthEl.value) || 0;
                this.saveROIProjectionSettings();
                this.debouncedCalculate();
            });
        }
    }

    /**
     * Load ROI projection settings from localStorage
     */
    loadROIProjectionSettings() {
        try {
            const stored = localStorage.getItem('roiProjectionSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                this.rampUpMonths = settings.rampUpMonths ?? 2;
                this.volumeGrowthRate = settings.volumeGrowthRate ?? 0;
            }
        } catch (e) { /* use defaults */ }

        const rampUpEl = document.getElementById('ramp-up-months');
        if (rampUpEl) rampUpEl.value = this.rampUpMonths;
        const growthEl = document.getElementById('volume-growth-rate');
        if (growthEl) growthEl.value = this.volumeGrowthRate;
    }

    /**
     * Save ROI projection settings to localStorage
     */
    saveROIProjectionSettings() {
        try {
            localStorage.setItem('roiProjectionSettings', JSON.stringify({
                rampUpMonths: this.rampUpMonths,
                volumeGrowthRate: this.volumeGrowthRate
            }));
        } catch (e) { /* ignore */ }
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
        // Total payment value with comma formatting
        const totalValueInput = document.getElementById('total-payment-value');
        if (totalValueInput) {
            totalValueInput.addEventListener('input', (e) => {
                const raw = FormatUtils.removeCommas(e.target.value);
                const formatted = FormatUtils.formatNumberWithCommas(raw);
                e.target.value = formatted;
                
                this.calculator.updateCustomerInfo('totalPaymentValue', raw);
                this.updateAverageTransactionSize();
                this.updatePaymentTypeDisplay();
                this.updatePaymentMethodDisplay();
                this.debouncedCalculate();
            });
        }

        // Total payment count with comma formatting
        const totalCountInput = document.getElementById('total-payment-count');
        if (totalCountInput) {
            totalCountInput.addEventListener('input', (e) => {
                const raw = FormatUtils.removeCommas(e.target.value);
                const formatted = FormatUtils.formatNumberWithCommas(raw);
                e.target.value = formatted;
                
                this.calculator.updateCustomerInfo('totalPaymentCount', raw);
                this.updateAverageTransactionSize();
                this.updatePaymentTypeDisplay();
                this.debouncedCalculate();
            });
        }


        // WACC input
        const waccInput = document.getElementById('wacc-input');
        if (waccInput) {
            waccInput.addEventListener('input', (e) => {
                this.calculator.updateCustomerInfo('wacc', e.target.value);
                this.debouncedCalculate();
            });
        }

        // Currency selector
        const currencyRadios = document.querySelectorAll('input[name="currency"]');
        currencyRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeCurrency(e.target.value);
            });
        });
    }

    /**
     * Setup slider listeners
     */
    setupSliderListeners() {
        // Payment type slider (local/cross-border)
        const paymentTypeSlider = document.getElementById('payment-type-slider');
        if (paymentTypeSlider) {
            paymentTypeSlider.addEventListener('input', (e) => {
                const localPercent = Math.round(parseFloat(e.target.value) * 100) / 100;
                this.calculator.updateCustomerInfo('paymentTypeDistribution.localPercent', localPercent);
                this.calculator.updateCustomerInfo('paymentTypeDistribution.crossBorderPercent', Math.round((100 - localPercent) * 100) / 100);
                this.updatePaymentTypeDisplay();
                this.debouncedCalculate();
            });
        }

        // Payment method slider (rail/card)
        const paymentMethodSlider = document.getElementById('payment-method-slider');
        if (paymentMethodSlider) {
            paymentMethodSlider.addEventListener('input', (e) => {
                const railPercent = Math.round(parseFloat(e.target.value) * 100) / 100;
                this.calculator.updateCustomerInfo('paymentMethodDistribution.railPercent', railPercent);
                this.calculator.updateCustomerInfo('paymentMethodDistribution.cardPercent', Math.round((100 - railPercent) * 100) / 100);
                this.updatePaymentMethodDisplay();
                this.updatePaymentTypeDisplay();
                this.debouncedCalculate();
            });
        }

        // FX share slider - percentage of cross-border rail payments
        const fxShareSlider = document.getElementById('fx-share-slider');
        if (fxShareSlider) {
            fxShareSlider.addEventListener('input', (e) => {
                const fxPercent = Math.round(parseFloat(e.target.value) * 100) / 100;
                this.calculator.updateCustomerInfo('fxPercentOfCrossBorder', fxPercent);
                
                this.updateFXShareDisplay();
                this.debouncedCalculate();
            });
        }
        
        // Current card rebate slider
        const currentCardRebateSlider = document.getElementById('current-card-rebate-slider');
        if (currentCardRebateSlider) {
            currentCardRebateSlider.addEventListener('input', (e) => {
                const rebate = Math.round(parseFloat(e.target.value) * 10) / 10;
                this.calculator.updateFee('currentProvider', 'cardRebate', rebate);
                this.updateCardRebateDisplay();
                this.debouncedCalculate();
            });
        }
    }

    /**
     * Setup fee input listeners
     */
    setupFeeListeners() {
        // Tungsten fees
        const tungstenFeeMap = {
            'tungsten-local-fee': 'localRail',
            'tungsten-crossborder-fee': 'crossBorder',
            'tungsten-fx-margin': 'fxMargin',
            'tungsten-card-rebate': 'cardRebate'
        };

        Object.entries(tungstenFeeMap).forEach(([id, field]) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.calculator.updateFee('tungsten', field, e.target.value);
                    this.debouncedCalculate();
                });
            }
        });

        // Current provider fees
        const currentFeeMap = {
            'current-local-fee': 'localRail',
            'current-crossborder-fee': 'crossBorder',
            'current-fx-margin': 'fxMargin'
        };

        Object.entries(currentFeeMap).forEach(([id, field]) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.calculator.updateFee('currentProvider', field, e.target.value);
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
     * Update average transaction size display
     */
    updateAverageTransactionSize() {
        const avg = this.calculator.calculateAverageTransactionSize();
        const symbol = this.calculator.getCurrencySymbol();
        const avgEl = document.getElementById('avg-transaction-size');
        if (avgEl) {
            avgEl.textContent = `${symbol}${FormatUtils.formatNumber(avg, 2)}`;
        }
    }

    /**
     * Update payment type distribution display
     * Shows ONLY rail payments (cards are excluded)
     */
    updatePaymentTypeDisplay() {
        const results = this.calculator.getResults();
        const breakdown = results.breakdown;
        const symbol = results.currencySymbol;
        
        // Use rails breakdown (which excludes cards)
        const localRails = breakdown.rails.local;
        const crossBorderRails = breakdown.rails.crossBorder;
        const typeDist = this.calculator.data.customerInfo.paymentTypeDistribution;
        
        const localPercentEl = document.getElementById('local-type-percent');
        const crossborderPercentEl = document.getElementById('crossborder-type-percent');
        const localAmountEl = document.getElementById('local-type-amount');
        const crossborderAmountEl = document.getElementById('crossborder-type-amount');
        const localCountEl = document.getElementById('local-type-count');
        const crossborderCountEl = document.getElementById('crossborder-type-count');
        
        if (localPercentEl) localPercentEl.textContent = FormatUtils.formatPercent(typeDist.localPercent, 0);
        if (crossborderPercentEl) crossborderPercentEl.textContent = FormatUtils.formatPercent(typeDist.crossBorderPercent, 0);
        if (localAmountEl) localAmountEl.textContent = FormatUtils.formatCurrency(localRails.value, 1, symbol);
        if (crossborderAmountEl) crossborderAmountEl.textContent = FormatUtils.formatCurrency(crossBorderRails.value, 1, symbol);
        if (localCountEl) localCountEl.textContent = `${FormatUtils.formatNumber(localRails.count, 0)} payments`;
        if (crossborderCountEl) crossborderCountEl.textContent = `${FormatUtils.formatNumber(crossBorderRails.count, 0)} payments`;
        
        // Update slider gradient - monochrome
        const slider = document.getElementById('payment-type-slider');
        if (slider) {
            const percent = Math.round(typeDist.localPercent * 100) / 100;
            slider.style.background = `linear-gradient(to right, var(--tungsten-primary) 0%, var(--tungsten-primary) ${percent}%, var(--gray-400) ${percent}%, var(--gray-400) 100%)`;
        }
    }

    /**
     * Update payment method distribution display
     */
    updatePaymentMethodDisplay() {
        const results = this.calculator.getResults();
        const breakdown = results.breakdown.method;
        const symbol = results.currencySymbol;
        
        const railPercentEl = document.getElementById('rail-method-percent');
        const cardPercentEl = document.getElementById('card-method-percent');
        const railAmountEl = document.getElementById('rail-method-amount');
        const cardAmountEl = document.getElementById('card-method-amount');
        
        if (railPercentEl) railPercentEl.textContent = FormatUtils.formatPercent(breakdown.rail.percent, 0);
        if (cardPercentEl) cardPercentEl.textContent = FormatUtils.formatPercent(breakdown.card.percent, 0);
        if (railAmountEl) railAmountEl.textContent = FormatUtils.formatCurrency(breakdown.rail.value, 1, symbol);
        if (cardAmountEl) cardAmountEl.textContent = FormatUtils.formatCurrency(breakdown.card.value, 1, symbol);
        
        // Update slider gradient - monochrome
        const slider = document.getElementById('payment-method-slider');
        if (slider) {
            const percent = Math.round(breakdown.rail.percent * 100) / 100;
            slider.style.background = `linear-gradient(to right, var(--tungsten-primary) 0%, var(--tungsten-primary) ${percent}%, var(--gray-400) ${percent}%, var(--gray-400) 100%)`;
        }
    }

    /**
     * Change currency and update all displays
     */
    changeCurrency(newCurrency) {
        this.calculator.changeCurrency(newCurrency);
        this.updateAllCurrencySymbols();
        this.updateAllInputs();
        this.calculate();
    }

    /**
     * Update all currency symbols in the UI (except currency selector)
     */
    updateAllCurrencySymbols() {
        const symbol = this.calculator.getCurrencySymbol();
        // Update input field prefix symbols (not the currency selector symbols)
        document.querySelectorAll('.input-prefix.currency-symbol').forEach(el => {
            el.textContent = symbol;
        });
        // Update currency labels in form labels e.g. "Setup fee ($)" — exclude currency selector
        document.querySelectorAll('.currency-label:not(.currency-selector .currency-label)').forEach(el => {
            el.textContent = symbol;
        });
    }

    /**
     * Update all input fields from calculator data
     */
    updateAllInputs() {
        const data = this.calculator.data;
        
        // Customer info with comma formatting
        const totalValueEl = document.getElementById('total-payment-value');
        if (totalValueEl) totalValueEl.value = FormatUtils.formatNumberWithCommas(data.customerInfo.totalPaymentValue);
        
        const totalCountEl = document.getElementById('total-payment-count');
        if (totalCountEl) totalCountEl.value = FormatUtils.formatNumberWithCommas(data.customerInfo.totalPaymentCount);
        
        
        // WACC input
        const waccInput = document.getElementById('wacc-input');
        if (waccInput) waccInput.value = data.customerInfo.wacc || 8.0;

        // Sliders
        const paymentTypeSlider = document.getElementById('payment-type-slider');
        if (paymentTypeSlider) paymentTypeSlider.value = data.customerInfo.paymentTypeDistribution.localPercent;
        
        const paymentMethodSlider = document.getElementById('payment-method-slider');
        if (paymentMethodSlider) paymentMethodSlider.value = data.customerInfo.paymentMethodDistribution.railPercent;

        // FX share slider
        const fxShareSlider = document.getElementById('fx-share-slider');
        if (fxShareSlider) fxShareSlider.value = data.customerInfo.fxPercentOfCrossBorder || 50;
        
        // Tungsten fees
        const tungstenLocalEl = document.getElementById('tungsten-local-fee');
        if (tungstenLocalEl) tungstenLocalEl.value = data.fees.tungsten.localRailFee;
        const tungstenCbEl = document.getElementById('tungsten-crossborder-fee');
        if (tungstenCbEl) tungstenCbEl.value = data.fees.tungsten.crossBorderFee;
        const tungstenFxEl = document.getElementById('tungsten-fx-margin');
        if (tungstenFxEl) tungstenFxEl.value = data.fees.tungsten.fxMargin;
        const tungstenRebateEl = document.getElementById('tungsten-card-rebate');
        if (tungstenRebateEl) tungstenRebateEl.value = data.fees.tungsten.cardRebate;

        // Current provider fees
        const curLocalEl = document.getElementById('current-local-fee');
        if (curLocalEl) curLocalEl.value = data.fees.currentProvider.localRailFee;
        const curCbEl = document.getElementById('current-crossborder-fee');
        if (curCbEl) curCbEl.value = data.fees.currentProvider.crossBorderFee;
        const curFxEl = document.getElementById('current-fx-margin');
        if (curFxEl) curFxEl.value = data.fees.currentProvider.fxMargin;
        
        // Card rebate slider (current provider only)
        const currentCardRebateSlider = document.getElementById('current-card-rebate-slider');
        if (currentCardRebateSlider) currentCardRebateSlider.value = data.fees.currentProvider.cardRebate;
        
        // Currency selector
        const currencyRadios = document.querySelectorAll('input[name="currency"]');
        currencyRadios.forEach(radio => {
            radio.checked = (radio.value === data.customerInfo.currency);
        });
        
        // Update displays
        this.updateAverageTransactionSize();
        this.updatePaymentTypeDisplay();
        this.updatePaymentMethodDisplay();
        this.updateFXShareDisplay();
        this.updateCardRebateDisplay();
        this.updateAllCurrencySymbols();
    }

    /**
     * Update card rebate display
     */
    updateCardRebateDisplay() {
        const currentRebate = this.calculator.data.fees.currentProvider.cardRebate;
        
        const currentPercentEl = document.getElementById('current-card-rebate-percent');
        if (currentPercentEl) {
            currentPercentEl.textContent = FormatUtils.formatPercent(currentRebate, 1);
        }
        
        // Update slider gradient
        const currentSlider = document.getElementById('current-card-rebate-slider');
        if (currentSlider) {
            const percent = (currentRebate / 5) * 100; // 5 is max value
            currentSlider.style.background = `linear-gradient(to right, var(--tungsten-primary) 0%, var(--tungsten-primary) ${percent}%, var(--gray-300) ${percent}%, var(--gray-300) 100%)`;
        }
    }

    /**
     * Setup settings toggle
     */
    setupSettingsToggle() {
        const toggleHeader = document.getElementById('settings-toggle');
        const toggleBtn = toggleHeader?.querySelector('.settings-toggle-btn');
        const content = document.getElementById('settings-content');
        const icon = toggleBtn?.querySelector('.toggle-icon');
        
        if (!toggleHeader || !content) return;
        
        toggleHeader.addEventListener('click', () => {
            const isExpanded = content.style.display !== 'none';
            
            if (isExpanded) {
                content.style.display = 'none';
                toggleBtn?.setAttribute('aria-expanded', 'false');
                if (icon) icon.textContent = '▼';
            } else {
                content.style.display = 'block';
                toggleBtn?.setAttribute('aria-expanded', 'true');
                if (icon) icon.textContent = '▲';
            }
        });
    }

    /**
     * Update FX share display (now % of cross-border)
     */
    updateFXShareDisplay() {
        const fxPercent = this.calculator.data.customerInfo.fxPercentOfCrossBorder || 50;
        const nonFxPercent = 100 - fxPercent;
        
        const fxPercentEl = document.getElementById('fx-share-percent');
        const nonFxPercentEl = document.getElementById('non-fx-share-percent');
        
        if (fxPercentEl) fxPercentEl.textContent = FormatUtils.formatPercent(fxPercent, 0);
        if (nonFxPercentEl) nonFxPercentEl.textContent = FormatUtils.formatPercent(nonFxPercent, 0);
        
        // Update calculated FX amount display
        const fxVolume = this.calculator.calculateFXVolume();
        const fxAmountEl = document.getElementById('fx-calculated-amount');
        if (fxAmountEl) {
            fxAmountEl.textContent = FormatUtils.formatCurrency(fxVolume, 1, this.calculator.getCurrencySymbol());
        }
        
        // Update slider gradient with rounded value
        const slider = document.getElementById('fx-share-slider');
        if (slider) {
            const percent = Math.round(fxPercent * 100) / 100;
            slider.style.background = `linear-gradient(to right,
                var(--tungsten-primary) 0%,
                var(--tungsten-primary) ${percent}%,
                var(--gray-300) ${percent}%,
                var(--gray-300) 100%)`;
        }
    }
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
     * Perform calculation and update UI
     */
    calculate() {
        if (this.isCalculating) return;

        this.isCalculating = true;
        this.showLoading();

        setTimeout(() => {
            try {
                const validation = this.calculator.validate();
                if (!validation.valid) {
                    this.showToast(validation.errors[0], 'error');
                    this.hideLoading();
                    this.isCalculating = false;
                    return;
                }

                // Build options based on mode
                const options = {};
                // Both modes get cumulative ROI
                options.includeCumulativeROI = true;
                options.cumulativeROIOptions = {
                    implementationCost: this.getTotalImplementationCost(),
                    monthlySubscription: this.monthlySubscription || 0,
                    rampUpMonths: this.rampUpMonths,
                    volumeGrowthRate: this.volumeGrowthRate
                };

                if (this.calculatorMode === 'partner-reseller') {
                    options.includePartnerUpside = true;
                    options.partnerConfig = this.partnerConfig;
                }

                const results = this.calculator.getResults(options);

                // Update summary cards
                this.updateSummaryCards(results);

                // Update charts
                this.chartsManager.updateCharts(results);

                // Update cumulative ROI chart (direct-to-client)
                if (results.cumulativeROI) {
                    this.chartsManager.updateCumulativeROIChart(results.cumulativeROI);
                    this.updateBreakEvenBadge(results.cumulativeROI);
                }

                // Update partner upside section (partner-reseller)
                if (results.partnerUpside) {
                    this.updatePartnerUpsideSection(results);
                }

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
     * Update break-even badge
     */
    updateBreakEvenBadge(cumulativeROIData) {
        const badge = document.getElementById('break-even-badge');
        const text = document.getElementById('break-even-text');
        if (!badge || !text) return;

        const hasImplCost = cumulativeROIData.implementationCost > 0;

        const growthNote = cumulativeROIData.volumeGrowthRate > 0
            ? ` | ${cumulativeROIData.volumeGrowthRate}% annual growth`
            : '';

        if (hasImplCost && cumulativeROIData.breakEvenPeriod) {
            badge.style.display = 'inline-flex';
            const symbol = this.calculator.getCurrencySymbol();
            text.textContent = `ROI break-even in Month ${cumulativeROIData.breakEvenPeriod} (${symbol}${FormatUtils.formatNumber(cumulativeROIData.implementationCost, 0)} impl. cost${growthNote})`;
        } else if (hasImplCost && !cumulativeROIData.breakEvenPeriod) {
            badge.style.display = 'inline-flex';
            text.textContent = `Break-even not reached within 12 months${growthNote}`;
        } else {
            badge.style.display = 'inline-flex';
            text.textContent = `Savings start from Month 1${growthNote}`;
        }
    }

    /**
     * Update partner upside section
     */
    updatePartnerUpsideSection(results) {
        const symbol = results.currencySymbol;
        const upside = results.partnerUpside;

        // SPIFF card
        const spiffCard = document.getElementById('spiff-card');
        if (spiffCard) {
            spiffCard.style.display = upside.spiff.enabled ? '' : 'none';
            const spiffVal = document.getElementById('partner-spiff-value');
            if (spiffVal) spiffVal.textContent = FormatUtils.formatCurrency(upside.spiff.value, 0, symbol, true);
        }

        // Bulk buy card
        const bulkCard = document.getElementById('bulk-buy-card');
        if (bulkCard) {
            bulkCard.style.display = upside.bulkBuy.enabled ? '' : 'none';
            const bulkVal = document.getElementById('partner-bulk-value');
            if (bulkVal) bulkVal.textContent = FormatUtils.formatCurrency(upside.bulkBuy.annualRevShare, 0, symbol, true);
            const bulkUpfront = document.getElementById('partner-bulk-upfront');
            if (bulkUpfront) bulkUpfront.textContent = upside.bulkBuy.upfrontCost > 0 ? `Upfront cost: ${FormatUtils.formatCurrency(upside.bulkBuy.upfrontCost, 0, symbol, true)}` : '';
        }

        // Revenue share card
        const revCard = document.getElementById('revenue-share-card');
        if (revCard) {
            revCard.style.display = upside.revenueShare.enabled ? '' : 'none';
            const revVal = document.getElementById('partner-revenue-value');
            if (revVal) revVal.textContent = FormatUtils.formatCurrency(upside.revenueShare.value, 0, symbol, true);
        }

        // Total upside
        const totalUpside = document.getElementById('partner-total-upside');
        if (totalUpside) totalUpside.textContent = FormatUtils.formatCurrency(upside.totalAnnualUpside, 0, symbol, true);
    }

    /**
     * Update summary cards - completely separated costs and incentives
     */
    updateSummaryCards(results) {
        const symbol = results.currencySymbol;
        
        // SECTION 1: Transaction costs (with commas)
        document.getElementById('current-total-cost').textContent =
            FormatUtils.formatCurrency(results.costs.current, 0, symbol, true);
        document.getElementById('tungsten-total-cost').textContent =
            FormatUtils.formatCurrency(results.costs.tungsten, 0, symbol, true);
        document.getElementById('cost-savings').textContent =
            FormatUtils.formatCurrency(results.costs.savings.total, 0, symbol, true);
        
        // SECTION 2: Card incentives (with commas)
        document.getElementById('current-incentive').textContent =
            FormatUtils.formatCurrency(results.incentives.current, 0, symbol, true);
        document.getElementById('tungsten-incentive').textContent =
            FormatUtils.formatCurrency(results.incentives.tungsten, 0, symbol, true);
        document.getElementById('incentive-differential').textContent =
            FormatUtils.formatCurrency(results.incentives.differential, 0, symbol, true);
        
        // SECTION 3: Total annual benefit (with commas)
        document.getElementById('total-benefit').textContent =
            FormatUtils.formatCurrency(results.totalAnnualBenefit, 0, symbol, true);
        
        // SECTION 4: Freed working capital (with commas)
        document.getElementById('freed-working-capital').textContent =
            FormatUtils.formatCurrency(results.freedWorkingCapital, 0, symbol, true);
        
        // Annual value of freed capital (WACC calculation)
        document.getElementById('wacc-value').textContent =
            FormatUtils.formatCurrency(results.waccValue, 0, symbol, true);
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
            // Ensure results panel is visible for chart capture
            const resultsPanel = document.getElementById('results-panel');
            const wasHidden = !resultsPanel?.classList.contains('active');
            if (wasHidden && resultsPanel) {
                resultsPanel.style.display = 'block';
                resultsPanel.style.position = 'absolute';
                resultsPanel.style.left = '-9999px';
            }

            await this.pdfExporter.generatePDF(this.currentResults, {
                mode: this.calculatorMode,
                partnerConfig: this.partnerConfig
            });

            // Restore results panel
            if (wasHidden && resultsPanel) {
                resultsPanel.style.display = '';
                resultsPanel.style.position = '';
                resultsPanel.style.left = '';
            }

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

    /**
     * Setup editable percentage functionality
     */
    setupEditablePercentages() {
        const editableElements = document.querySelectorAll('.editable-percent');
        
        editableElements.forEach(element => {
            // Store original value on focus
            element.addEventListener('focus', function() {
                this.dataset.originalValue = this.textContent;
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(this);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });
            
            // Handle blur (when user clicks away)
            element.addEventListener('blur', (e) => {
                this.handlePercentageEdit(e.target);
            });
            
            // Handle Enter key
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
                // Only allow numbers, decimal point, and %
                if (e.key.length === 1 && !/[\d.%]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
            });
            
            // Prevent paste of non-numeric content
            element.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                const numericText = text.replace(/[^\d.]/g, '');
                document.execCommand('insertText', false, numericText);
            });
        });
    }
    
    /**
     * Handle percentage edit
     */
    handlePercentageEdit(element) {
        const sliderId = element.dataset.slider;
        if (!sliderId) return;
        
        const slider = document.getElementById(sliderId);
        if (!slider) return;
        
        // Parse the entered value
        let value = parseFloat(element.textContent.replace('%', '').trim());
        
        // Validate
        if (isNaN(value) || value < 0 || value > 100) {
            // Restore original value
            element.textContent = element.dataset.originalValue;
            this.showToast('Please enter a value between 0 and 100', 'error');
            return;
        }
        
        // Round to 2 decimals
        value = Math.round(value * 100) / 100;
        
        // Update slider
        slider.value = value;
        
        // Trigger the appropriate update based on slider type
        if (sliderId === 'payment-method-slider') {
            this.calculator.updateCustomerInfo('paymentMethodDistribution.railPercent', value);
            this.calculator.updateCustomerInfo('paymentMethodDistribution.cardPercent', Math.round((100 - value) * 100) / 100);
            this.updatePaymentMethodDisplay();
            this.updatePaymentTypeDisplay();
        } else if (sliderId === 'payment-type-slider') {
            this.calculator.updateCustomerInfo('paymentTypeDistribution.localPercent', value);
            this.calculator.updateCustomerInfo('paymentTypeDistribution.crossBorderPercent', Math.round((100 - value) * 100) / 100);
            this.updatePaymentTypeDisplay();
        } else if (sliderId === 'fx-share-slider') {
            this.calculator.updateCustomerInfo('fxPercentOfCrossBorder', value);
            this.updateFXShareDisplay();
        } else if (sliderId === 'current-card-rebate-slider') {
            this.calculator.updateFee('currentProvider', 'cardRebate', value);
            this.updateCardRebateDisplay();
        }
        
        // Recalculate
        this.debouncedCalculate();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TungstenROIApp();
    window.app.init();
});