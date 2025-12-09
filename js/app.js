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
        
        // Initialize charts
        this.chartsManager.initializeCharts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup logo triple-click toggle
        this.setupLogoToggle();
        
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
    setupLogoToggle() {
        const logo = document.querySelector('.app-logo');
        const settingsSection = document.getElementById('tungsten-settings');
        
        if (!logo || !settingsSection) return;
        
        let clickCount = 0;
        let clickTimer = null;
        
        logo.addEventListener('click', (e) => {
            clickCount++;
            
            // Clear existing timer
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            
            // Set new timer to reset click count after 500ms
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 500);
            
            // Check for triple-click
            if (clickCount === 3) {
                clickCount = 0;
                clearTimeout(clickTimer);
                
                // Check if already visible
                const isHidden = settingsSection.classList.contains('hidden');
                
                if (isHidden) {
                    // Prompt for password
                    const password = prompt('Enter admin password:');
                    
                    if (password === 'projectgold') {
                        settingsSection.classList.remove('hidden');
                        settingsSection.classList.add('visible');
                        this.showToast('Tungsten fee settings unlocked', 'success');
                        
                        // Save state to localStorage
                        localStorage.setItem('tungstenSettingsVisible', 'true');
                    } else if (password !== null) {
                        // User entered wrong password (not cancelled)
                        this.showToast('Incorrect password', 'error');
                    }
                } else {
                    // Hide settings (no password needed to hide)
                    settingsSection.classList.add('hidden');
                    settingsSection.classList.remove('visible');
                    this.showToast('Tungsten fee settings hidden', 'success');
                    
                    // Save state to localStorage
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
                this.updatePaymentTypeDisplay(); // Update rail type display since rail total changed
                this.debouncedCalculate();
            });
        }

        // FX Tier 1 slider
        const fxTier1Slider = document.getElementById('fx-tier1-slider');
        if (fxTier1Slider) {
            fxTier1Slider.addEventListener('input', (e) => {
                const tier1Percent = Math.round(parseFloat(e.target.value) * 100) / 100;
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
                const tier2Percent = Math.round(parseFloat(e.target.value) * 100) / 100;
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
                const tier3Percent = Math.round(parseFloat(e.target.value) * 100) / 100;
                this.calculator.adjustFXTiers(3, tier3Percent);
                this.updateFXDistribution();
                this.updateFXSliderValues();
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
                this.updateFXDistribution();
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
            'tungsten-card-fee': 'cardRebate'
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
            'current-card-fee': 'cardRebate'
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
        // Only update input field symbols, not the currency selector symbols
        document.querySelectorAll('.input-prefix.currency-symbol').forEach(el => {
            el.textContent = symbol;
        });
        // Update currency value displays
        document.querySelectorAll('.currency-value').forEach(el => {
            // These are already formatted with symbols, no need to update
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
        
        const fxVolumeEl = document.getElementById('fx-volume');
        if (fxVolumeEl) fxVolumeEl.value = FormatUtils.formatNumberWithCommas(data.customerInfo.fxVolume.total);
        
        const implCostEl = document.getElementById('implementation-cost');
        if (implCostEl) implCostEl.value = FormatUtils.formatNumberWithCommas(data.customerInfo.implementationCost);

        // Sliders
        const paymentTypeSlider = document.getElementById('payment-type-slider');
        if (paymentTypeSlider) paymentTypeSlider.value = data.customerInfo.paymentTypeDistribution.localPercent;
        
        const paymentMethodSlider = document.getElementById('payment-method-slider');
        if (paymentMethodSlider) paymentMethodSlider.value = data.customerInfo.paymentMethodDistribution.railPercent;
        
        const fxTier1Slider = document.getElementById('fx-tier1-slider');
        if (fxTier1Slider) fxTier1Slider.value = data.customerInfo.fxVolume.distribution.tier1Percent;
        
        const fxTier2Slider = document.getElementById('fx-tier2-slider');
        if (fxTier2Slider) fxTier2Slider.value = data.customerInfo.fxVolume.distribution.tier2Percent;
        
        const fxTier3Slider = document.getElementById('fx-tier3-slider');
        if (fxTier3Slider) fxTier3Slider.value = data.customerInfo.fxVolume.distribution.tier3Percent;
        
        // FX share slider
        const fxShareSlider = document.getElementById('fx-share-slider');
        if (fxShareSlider) fxShareSlider.value = data.customerInfo.fxPercentOfCrossBorder || 50;
        
        // Tungsten fees
        document.getElementById('tungsten-local-fee').value = data.fees.tungsten.localRailFee;
        document.getElementById('tungsten-crossborder-fee').value = data.fees.tungsten.crossBorderFee;
        document.getElementById('tungsten-fx-tier1').value = data.fees.tungsten.fxMargins.tier1;
        document.getElementById('tungsten-fx-tier2').value = data.fees.tungsten.fxMargins.tier2;
        document.getElementById('tungsten-fx-tier3').value = data.fees.tungsten.fxMargins.tier3;
        document.getElementById('tungsten-card-fee').value = data.fees.tungsten.cardRebate;
        
        // Current provider fees
        document.getElementById('current-local-fee').value = data.fees.currentProvider.localRailFee;
        document.getElementById('current-crossborder-fee').value = data.fees.currentProvider.crossBorderFee;
        document.getElementById('current-fx-tier1').value = data.fees.currentProvider.fxMargins.tier1;
        document.getElementById('current-fx-tier2').value = data.fees.currentProvider.fxMargins.tier2;
        document.getElementById('current-fx-tier3').value = data.fees.currentProvider.fxMargins.tier3;
        document.getElementById('current-card-fee').value = data.fees.currentProvider.cardRebate;
        
        // Currency selector
        const currencyRadios = document.querySelectorAll('input[name="currency"]');
        currencyRadios.forEach(radio => {
            radio.checked = (radio.value === data.customerInfo.currency);
        });
        
        // Update displays
        this.updateAverageTransactionSize();
        this.updatePaymentTypeDisplay();
        this.updatePaymentMethodDisplay();
        this.updateFXDistribution();
        this.updateFXShareDisplay();
        this.updateAllCurrencySymbols();
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
        
        // Update slider displays - monochrome with rounded values
        const tier1Slider = document.getElementById('fx-tier1-slider');
        if (tier1Slider) {
            const percent1 = Math.round(dist.tier1Percent * 100) / 100;
            tier1Slider.style.background = `linear-gradient(to right, var(--tungsten-primary) 0%, var(--tungsten-primary) ${percent1}%, var(--gray-300) ${percent1}%, var(--gray-300) 100%)`;
        }
        
        const tier2Slider = document.getElementById('fx-tier2-slider');
        if (tier2Slider) {
            const percent2 = Math.round(dist.tier2Percent * 100) / 100;
            tier2Slider.style.background = `linear-gradient(to right, var(--gray-500) 0%, var(--gray-500) ${percent2}%, var(--gray-300) ${percent2}%, var(--gray-300) 100%)`;
        }

        const tier3Slider = document.getElementById('fx-tier3-slider');
        if (tier3Slider) {
            const percent3 = Math.round(dist.tier3Percent * 100) / 100;
            tier3Slider.style.background = `linear-gradient(to right, var(--gray-600) 0%, var(--gray-600) ${percent3}%, var(--gray-300) ${percent3}%, var(--gray-300) 100%)`;
        }
    }

    /**
     * Update FX slider values to match calculator data
     */

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
        const fxVolumes = this.calculator.calculateFXVolumes();
        const fxAmountEl = document.getElementById('fx-calculated-amount');
        if (fxAmountEl) {
            fxAmountEl.textContent = FormatUtils.formatCurrency(fxVolumes.total, 1, this.calculator.getCurrencySymbol());
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
            this.calculator.updateCustomerInfo('fxPaymentSharePercent', value);
            
            // Update FX volume based on total payment value and FX percentage
            const totalValue = this.calculator.data.customerInfo.totalPaymentValue;
            const newFxVolume = Math.round((totalValue * value / 100) * 100) / 100;
            this.calculator.updateCustomerInfo('fxVolume.total', newFxVolume);
            
            // Update FX volume input field
            const fxVolumeInput = document.getElementById('fx-volume');
            if (fxVolumeInput) {
                fxVolumeInput.value = FormatUtils.formatNumberWithCommas(newFxVolume);
            }
            
            this.updateFXShareDisplay();
            this.updateFXDistribution();
        } else if (sliderId === 'fx-tier1-slider') {
            this.calculator.adjustFXTiers(1, value);
            this.updateFXDistribution();
            this.updateFXSliderValues();
        } else if (sliderId === 'fx-tier2-slider') {
            this.calculator.adjustFXTiers(2, value);
            this.updateFXDistribution();
            this.updateFXSliderValues();
        } else if (sliderId === 'fx-tier3-slider') {
            this.calculator.adjustFXTiers(3, value);
            this.updateFXDistribution();
            this.updateFXSliderValues();
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