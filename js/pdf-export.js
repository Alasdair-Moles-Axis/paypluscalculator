/**
 * Tungsten Pay+ Payments Optimisation Analysis - PDF Export Module
 * Single-page format: all content must fit on one A4 page
 * Monochrome design (Prussian Blue and grays)
 */

class PDFExporter {
    constructor() {
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 12;
        this.contentWidth = this.pageWidth - (2 * this.margin);

        // Monochrome color palette
        this.colors = {
            primary: [0, 40, 84],
            darkGray: [75, 85, 99],
            mediumGray: [107, 114, 128],
            lightGray: [156, 163, 175],
            veryLightGray: [209, 213, 219],
            white: [255, 255, 255],
            black: [0, 0, 0]
        };
    }

    /**
     * Format currency for PDF - avoids toLocaleString kerning issues
     * Manually formats with commas to ensure clean rendering in jsPDF
     */
    pdfCurrency(value, symbol = '$', decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) return symbol + '0';
        const sign = value < 0 ? '-' : '';
        const abs = Math.abs(value);
        const fixed = abs.toFixed(decimals);
        const parts = fixed.split('.');
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const result = parts.length > 1 ? intPart + '.' + parts[1] : intPart;
        return sign + symbol + result;
    }

    /**
     * Format abbreviated currency for PDF (K/M/B)
     */
    pdfCurrencyShort(value, symbol = '$') {
        if (value === null || value === undefined || isNaN(value)) return symbol + '0';
        const sign = value < 0 ? '-' : '';
        const abs = Math.abs(value);
        if (abs >= 1000000000) return sign + symbol + (abs / 1000000000).toFixed(1) + 'B';
        if (abs >= 1000000) return sign + symbol + (abs / 1000000).toFixed(1) + 'M';
        if (abs >= 1000) return sign + symbol + (abs / 1000).toFixed(1) + 'K';
        return sign + symbol + abs.toFixed(0);
    }

    /**
     * Load image as base64 for jsPDF
     */
    async loadImageAsBase64(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = function() { resolve(null); };
            img.src = imagePath;
        });
    }

    /**
     * Generate and download single-page PDF report (mode-aware)
     */
    async generatePDF(results, options = {}) {
        try {
            if (!results || !results.data || !results.costs || !results.incentives || !results.detailedCosts) {
                throw new Error('Invalid results object structure');
            }

            const mode = options.mode || 'direct-to-client';
            const sym = results.currencySymbol;
            const { jsPDF } = window.jspdf;
            if (!jsPDF) throw new Error('jsPDF library not loaded');

            const doc = new jsPDF('p', 'mm', 'a4');

            let tungstenLogo = (typeof CONFIG !== 'undefined' && CONFIG.pdfLogos) ? CONFIG.pdfLogos.tungstenLogo : null;
            if (!tungstenLogo) tungstenLogo = await this.loadImageAsBase64('assets/tungsten_logo.jpg');

            let y = this.margin;

            // ── HEADER ──
            // Tungsten Automation logo (top-right)
            if (tungstenLogo) {
                try { doc.addImage(tungstenLogo, 'JPEG', this.pageWidth - this.margin - 50, y - 4, 50, 14); } catch(e) {}
            }
            doc.setFontSize(18);
            doc.setTextColor(...this.colors.primary);
            doc.setFont(undefined, 'bold');
            doc.text('Tungsten Pay+', this.margin, y);
            doc.setFontSize(10);
            doc.setTextColor(...this.colors.mediumGray);
            doc.setFont(undefined, 'normal');
            doc.text('Payments optimisation analysis', this.margin, y + 5);
            doc.setFontSize(8);
            doc.setTextColor(...this.colors.lightGray);
            doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                this.margin, y + 10);
            y += 10;
            doc.setDrawColor(...this.colors.veryLightGray);
            doc.setLineWidth(0.5);
            doc.line(this.margin, y, this.pageWidth - this.margin, y);
            y += 4;

            // ── PLACEHOLDER TEXT ──
            const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
            doc.setFontSize(9);
            doc.setTextColor(...this.colors.darkGray);
            doc.setFont(undefined, 'normal');
            const introText = pdfText.placeholderText || 'Pay+ seamlessly enables the completion of the invoice-to-pay lifecycle through modern payments orchestration for flexibility and economical transactions.';
            const introLines = doc.splitTextToSize(introText, this.contentWidth);
            introLines.forEach(line => { doc.text(line, this.margin, y); y += 3.5; });
            y += 2;

            // ── KEY FACTS (two-column) ──
            doc.setFontSize(10);
            doc.setTextColor(...this.colors.black);
            doc.setFont(undefined, 'bold');
            doc.text('What you have told us', this.margin, y);
            y += 5;

            const data = results.data.customerInfo;
            const lh = 4.5;
            const rightCol = this.margin + (this.contentWidth / 2) + 2;
            doc.setFontSize(8);
            doc.setTextColor(...this.colors.darkGray);
            doc.setFont(undefined, 'normal');

            let leftY = y, rightY = y;

            doc.text('Base currency: ' + data.currency, this.margin, leftY); leftY += lh;
            doc.text('Annual payment value: ' + this.pdfCurrency(data.totalPaymentValue, sym), this.margin, leftY); leftY += lh;
            doc.text('Annual payment count: ' + FormatUtils.formatNumber(data.totalPaymentCount, 0), this.margin, leftY); leftY += lh;
            doc.text('  Bank payments: ' + data.paymentMethodDistribution.railPercent + '%', this.margin, leftY); leftY += lh;
            doc.text('    Local: ' + data.paymentTypeDistribution.localPercent + '% | X-border: ' + data.paymentTypeDistribution.crossBorderPercent + '%', this.margin, leftY); leftY += lh;
            doc.text('    FX % of X-border: ' + data.fxPercentOfCrossBorder + '%', this.margin, leftY); leftY += lh;
            doc.text('  Card payments: ' + data.paymentMethodDistribution.cardPercent + '%', this.margin, leftY); leftY += lh;

            if (mode === 'direct-to-client') {
                doc.text('Current local fee: ' + this.pdfCurrency(results.data.fees.currentProvider.localRailFee, sym, 2), rightCol, rightY); rightY += lh;
                doc.text('Current X-border fee: ' + this.pdfCurrency(results.data.fees.currentProvider.crossBorderFee, sym, 2), rightCol, rightY); rightY += lh;
                doc.text('Current FX margin: ' + results.data.fees.currentProvider.fxMargin + '%', rightCol, rightY); rightY += lh;
                doc.text('Current card rebate: ' + results.data.fees.currentProvider.cardRebate + '%', rightCol, rightY); rightY += lh;
            } else {
                doc.text('Current annual cost: ' + this.pdfCurrency(results.costs.current, sym), rightCol, rightY); rightY += lh;
                doc.text('Estimated annual savings: ' + this.pdfCurrency(results.costs.savings.total, sym), rightCol, rightY); rightY += lh;
            }
            doc.text('WACC: ' + results.wacc + '%', rightCol, rightY); rightY += lh;

            y = Math.max(leftY, rightY) + 1;

            // Cost summary line
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...this.colors.black);
            doc.text('Current annual cost: ' + this.pdfCurrency(results.costs.current, sym), this.margin, y);
            doc.setTextColor(...this.colors.primary);
            doc.text('Tungsten annual cost: ' + this.pdfCurrency(results.costs.tungsten, sym), rightCol, y);
            y += 6;

            // ── EXECUTIVE SUMMARY ──
            doc.setFontSize(10);
            doc.setTextColor(...this.colors.black);
            doc.setFont(undefined, 'bold');
            doc.text('Executive Summary', this.margin, y);
            y += 4;
            doc.setFontSize(8);
            doc.setTextColor(...this.colors.darkGray);
            doc.setFont(undefined, 'italic');
            const summaryText = this.generateExecutiveSummary(results, mode, sym);
            const summaryLines = doc.splitTextToSize(summaryText, this.contentWidth);
            summaryLines.forEach(line => { doc.text(line, this.margin, y); y += 3.5; });
            y += 3;

            // ── TRANSACTION COST TABLE ──
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...this.colors.black);
            doc.text('Transaction cost savings', this.margin, y);
            y += 4;

            const colW = [28, 26, 26, 18, 88];
            const rh = 7;

            // Header row
            doc.setFillColor(...this.colors.veryLightGray);
            doc.rect(this.margin, y, this.contentWidth, rh, 'F');
            doc.setFontSize(6.5);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...this.colors.black);
            let x = this.margin;
            ['Payment type', 'Current cost', 'Tungsten cost', '% savings', 'Value driver'].forEach((h, i) => {
                doc.text(h, x + 2, y + 4); x += colW[i];
            });
            y += rh;

            // Data rows
            const costRows = [
                { type: 'Local rail', current: results.detailedCosts.current.localRail, tungsten: results.detailedCosts.tungsten.localRail, savings: results.costs.savings.localRail, driver: 'localRail' },
                { type: 'Cross-border', current: results.detailedCosts.current.crossBorderRail, tungsten: results.detailedCosts.tungsten.crossBorderRail, savings: results.costs.savings.crossBorderRail, driver: 'crossBorder' },
                { type: 'FX', current: results.detailedCosts.current.fx.total, tungsten: results.detailedCosts.tungsten.fx.total, savings: results.costs.savings.fx, driver: 'fx' }
            ];

            doc.setFontSize(6.5);
            costRows.forEach((row, i) => {
                x = this.margin;
                if (i % 2 === 1) { doc.setFillColor(250, 250, 250); doc.rect(this.margin, y, this.contentWidth, rh, 'F'); }
                doc.setTextColor(...this.colors.black); doc.setFont(undefined, 'normal');
                doc.text(row.type, x + 2, y + 4); x += colW[0];
                doc.text(this.pdfCurrency(row.current, sym), x + 2, y + 4); x += colW[1];
                doc.text(this.pdfCurrency(row.tungsten, sym), x + 2, y + 4); x += colW[2];
                const pct = row.current > 0 ? ((row.savings / row.current) * 100) : 0;
                doc.setTextColor(...this.colors.primary); doc.setFont(undefined, 'bold');
                doc.text(pct.toFixed(1) + '%', x + 2, y + 4); x += colW[3];
                doc.setTextColor(...this.colors.mediumGray); doc.setFont(undefined, 'normal');
                doc.text(this.getValueDriverNote(row.driver, pct), x + 2, y + 4, { maxWidth: colW[4] - 4 });
                y += rh;
            });

            // Total row
            x = this.margin;
            doc.setFillColor(...this.colors.primary);
            doc.rect(this.margin, y, this.contentWidth, rh, 'F');
            doc.setTextColor(...this.colors.white); doc.setFont(undefined, 'bold');
            doc.text('TOTAL COSTS', x + 2, y + 4); x += colW[0];
            doc.text(this.pdfCurrency(results.costs.current, sym), x + 2, y + 4); x += colW[1];
            doc.text(this.pdfCurrency(results.costs.tungsten, sym), x + 2, y + 4); x += colW[2];
            doc.text(results.costs.savingsPercentage.toFixed(1) + '%', x + 2, y + 4);
            y += rh + 5;

            // ── CARD INCENTIVES (compact single row) ──
            doc.setFontSize(10);
            doc.setTextColor(...this.colors.black);
            doc.setFont(undefined, 'bold');
            doc.text('Card incentive differential', this.margin, y);
            y += 4;

            x = this.margin;
            doc.setFillColor(...this.colors.veryLightGray);
            doc.rect(this.margin, y, this.contentWidth, rh, 'F');
            doc.setFontSize(6.5); doc.setFont(undefined, 'bold'); doc.setTextColor(...this.colors.black);
            ['Payment type', 'Current', 'Tungsten', '% increase', 'Value driver'].forEach((h, i) => {
                doc.text(h, x + 2, y + 4); x += colW[i];
            });
            y += rh;

            x = this.margin;
            doc.setFont(undefined, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...this.colors.black);
            doc.text('Card rebates', x + 2, y + 4); x += colW[0];
            doc.text(this.pdfCurrency(results.incentives.current, sym), x + 2, y + 4); x += colW[1];
            doc.text(this.pdfCurrency(results.incentives.tungsten, sym), x + 2, y + 4); x += colW[2];
            doc.setTextColor(...this.colors.primary); doc.setFont(undefined, 'bold');
            doc.text(results.incentives.increasePercentage.toFixed(1) + '%', x + 2, y + 4); x += colW[3];
            doc.setTextColor(...this.colors.mediumGray); doc.setFont(undefined, 'normal');
            doc.text(this.getValueDriverNote('cards', Math.abs(results.incentives.increasePercentage)), x + 2, y + 4, { maxWidth: colW[4] - 4 });
            y += rh + 5;

            // ── TOTAL ANNUAL BENEFIT BOX ──
            const benefitBoxH = 16;
            doc.setFillColor(...this.colors.primary);
            doc.roundedRect(this.margin, y, this.contentWidth, benefitBoxH, 2, 2, 'F');
            doc.setTextColor(...this.colors.white);
            doc.setFontSize(8); doc.setFont(undefined, 'normal');
            doc.text('Total annual benefit', this.margin + 4, y + 5);
            doc.setFontSize(16); doc.setFont(undefined, 'bold');
            doc.text(this.pdfCurrency(results.totalAnnualBenefit, sym), this.margin + 4, y + 13);
            // Breakdown on the right side
            doc.setFontSize(8); doc.setFont(undefined, 'normal');
            const breakdownText = 'Cost savings: ' + this.pdfCurrency(results.costs.savings.total, sym) + '  +  Incentive: ' + this.pdfCurrency(results.incentives.differential, sym);
            doc.text(breakdownText, this.pageWidth - this.margin - 4, y + 10, { align: 'right' });
            y += benefitBoxH + 5;

            // ── FREED WORKING CAPITAL (compact inline) ──
            const halfW = this.contentWidth / 2;
            const fwcH = 14;
            doc.setFillColor(...this.colors.mediumGray);
            doc.roundedRect(this.margin, y, halfW - 1, fwcH, 2, 2, 'F');
            doc.setTextColor(...this.colors.white);
            doc.setFontSize(7); doc.setFont(undefined, 'normal');
            doc.text('Freed capital (30-day terms)', this.margin + 3, y + 4);
            doc.setFontSize(10); doc.setFont(undefined, 'bold');
            doc.text(this.pdfCurrency(results.freedWorkingCapital, sym), this.margin + 3, y + 11);

            doc.setFillColor(...this.colors.primary);
            doc.roundedRect(this.margin + halfW + 1, y, halfW - 1, fwcH, 2, 2, 'F');
            doc.setFontSize(7); doc.setFont(undefined, 'normal');
            doc.text('Annual value of freed capital', this.margin + halfW + 4, y + 4);
            doc.setFontSize(10); doc.setFont(undefined, 'bold');
            doc.text(this.pdfCurrency(results.waccValue, sym), this.margin + halfW + 4, y + 11);
            y += fwcH + 5;

            // ── MODE-SPECIFIC SECTION ──
            if (mode === 'direct-to-client' && results.cumulativeROI) {
                y = this.addCumulativeROICompact(doc, y, results, sym);
            }
            if (mode === 'partner-reseller' && results.partnerUpside) {
                y = this.addPartnerUpsideCompact(doc, y, results, sym);
            }

            // ── FOOTER ──
            this.addFooter(doc);

            const modePrefix = mode === 'partner-reseller' ? 'Partner_' : '';
            doc.save(`Tungsten_${modePrefix}Payments_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    /**
     * Compact cumulative ROI section - milestone table instead of 12 bars
     */
    addCumulativeROICompact(doc, y, results, sym) {
        const roi = results.cumulativeROI;
        if (!roi || !roi.timeline) return y;

        doc.setFontSize(10);
        doc.setTextColor(...this.colors.black);
        doc.setFont(undefined, 'bold');
        doc.text('Cumulative Savings Timeline', this.margin, y);
        y += 4;

        const hasImpl = roi.implementationCost > 0;
        const hasSub = roi.monthlySubscription > 0;
        const hasGrowth = roi.volumeGrowthRate > 0;
        const hasCosts = hasImpl || hasSub;

        // Callout line
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...this.colors.primary);
        let callout = '';
        if (hasCosts && roi.breakEvenPeriod) {
            const costs = [];
            if (hasImpl) costs.push('impl: ' + this.pdfCurrencyShort(roi.implementationCost, sym));
            if (hasSub) costs.push('sub: ' + this.pdfCurrencyShort(roi.monthlySubscription, sym) + '/mo');
            callout = 'ROI break-even: Month ' + roi.breakEvenPeriod + ' (' + costs.join(', ') + ')';
        } else if (hasCosts) {
            callout = 'Break-even not reached in 12 months';
        } else {
            callout = 'Savings start from Month 1';
        }
        if (hasGrowth) callout += '  |  Volume growth: ' + roi.volumeGrowthRate + '% p.a.';
        doc.text(callout, this.margin, y);
        y += 4;

        // Milestone table: M1, M3, M6, M9, M12
        const milestones = [1, 3, 6, 9, 12].filter(m => m <= roi.timeline.length);
        const mw = this.contentWidth / milestones.length;
        const mh = 16;

        milestones.forEach((m, i) => {
            const item = roi.timeline[m - 1];
            const val = hasImpl ? item.netPosition : item.cumulativeSavings;
            const mx = this.margin + (i * mw);
            const isNeg = val < 0;

            // Box
            doc.setFillColor(isNeg ? 240 : 245, isNeg ? 235 : 248, isNeg ? 235 : 255);
            doc.roundedRect(mx + 1, y, mw - 2, mh, 1.5, 1.5, 'F');
            doc.setDrawColor(...this.colors.veryLightGray);
            doc.setLineWidth(0.3);
            doc.roundedRect(mx + 1, y, mw - 2, mh, 1.5, 1.5, 'S');

            // Month label
            doc.setFontSize(7);
            doc.setTextColor(...this.colors.mediumGray);
            doc.setFont(undefined, 'bold');
            doc.text('Month ' + m, mx + mw / 2, y + 4, { align: 'center' });

            // Value
            doc.setFontSize(9);
            doc.setTextColor(isNeg ? 180 : 0, isNeg ? 50 : 40, isNeg ? 50 : 84);
            doc.setFont(undefined, 'bold');
            doc.text(this.pdfCurrencyShort(val, sym), mx + mw / 2, y + 11, { align: 'center' });
        });
        y += mh + 3;

        // Monthly benefit line
        doc.setFontSize(7);
        doc.setTextColor(...this.colors.mediumGray);
        doc.setFont(undefined, 'normal');
        doc.text('Monthly benefit at scale: ' + this.pdfCurrency(roi.monthlyBenefitAtScale, sym) + '/mo', this.margin, y);
        y += 5;

        return y;
    }

    /**
     * Compact partner upside section
     */
    addPartnerUpsideCompact(doc, y, results, sym) {
        const u = results.partnerUpside;
        if (!u) return y;

        doc.setFontSize(10);
        doc.setTextColor(...this.colors.black);
        doc.setFont(undefined, 'bold');
        doc.text('Partner Upside Summary', this.margin, y);
        y += 5;

        doc.setFontSize(8);
        const items = [];
        if (u.spiff.enabled) items.push({ label: 'SPIFF (one-time)', value: this.pdfCurrency(u.spiff.value, sym) });
        if (u.bulkBuy.enabled) {
            items.push({ label: 'Bulk buy margin share (annual)', value: this.pdfCurrency(u.bulkBuy.annualMarginShare || 0, sym) });
            if (u.bulkBuy.upfrontCost > 0) {
                items.push({ label: '  Upfront cost (' + (u.bulkBuy.numberOfLicenses || 0) + ' licenses)', value: this.pdfCurrency(u.bulkBuy.upfrontCost, sym) });
                if (u.bulkBuy.roiPercent != null) items.push({ label: '  ROI / Payback', value: u.bulkBuy.roiPercent.toFixed(1) + '% / ' + (u.bulkBuy.paybackMonths ? u.bulkBuy.paybackMonths + 'mo' : 'N/A') });
            }
        }
        if (u.revenueShare.enabled) items.push({ label: 'Standard rev share (annual)', value: this.pdfCurrency(u.revenueShare.value, sym) });

        items.forEach(item => {
            doc.setTextColor(...this.colors.darkGray); doc.setFont(undefined, 'normal');
            doc.text(item.label + ':', this.margin, y);
            doc.setTextColor(...this.colors.primary); doc.setFont(undefined, 'bold');
            doc.text(item.value, this.margin + 55, y);
            y += 5;
        });

        // Total box
        const bh = 12;
        doc.setFillColor(...this.colors.primary);
        doc.roundedRect(this.margin, y, this.contentWidth, bh, 2, 2, 'F');
        doc.setTextColor(...this.colors.white);
        doc.setFontSize(8); doc.setFont(undefined, 'normal');
        doc.text('Total Partner Annual Upside', this.margin + 4, y + 4);
        doc.setFontSize(12); doc.setFont(undefined, 'bold');
        doc.text(this.pdfCurrency(u.totalAnnualUpside, sym), this.margin + 4, y + 10);
        y += bh + 5;

        return y;
    }

    /**
     * Generate executive summary auto-text
     */
    generateExecutiveSummary(results, mode, sym) {
        const totalBenefit = this.pdfCurrency(results.totalAnnualBenefit, sym);
        const costSavings = this.pdfCurrency(results.costs.savings.total, sym);
        const savingsPct = results.costs.savingsPercentage.toFixed(1) + '%';
        const roi = results.cumulativeROI;

        let s = 'Based on ' + this.pdfCurrency(results.data.customerInfo.totalPaymentValue, sym) + ' in annual payments across ' +
            FormatUtils.formatNumber(results.data.customerInfo.totalPaymentCount, 0) + ' transactions, ' +
            'Tungsten Pay+ delivers ' + totalBenefit + ' in total annual benefit (' + costSavings + ' cost savings, ' + savingsPct + ')';

        if (results.incentives.differential > 0) {
            s += ' plus ' + this.pdfCurrency(results.incentives.differential, sym) + ' in improved card rebates';
        }
        s += '. ';

        if (roi) {
            const costParts = [];
            if (roi.implementationCost > 0) costParts.push(this.pdfCurrency(roi.implementationCost, sym) + ' implementation');
            if (roi.monthlySubscription > 0) costParts.push(this.pdfCurrency(roi.monthlySubscription, sym) + '/mo subscription');
            if (costParts.length > 0 && roi.breakEvenPeriod) {
                s += 'Accounting for ' + costParts.join(' + ') + ', ROI is achieved in month ' + roi.breakEvenPeriod + '. ';
            } else if (costParts.length > 0) {
                s += 'Accounting for ' + costParts.join(' + ') + '. ';
            }
            if (roi.volumeGrowthRate > 0) {
                s += 'At ' + roi.volumeGrowthRate + '% annual volume growth, first-year cumulative savings reach ' + this.pdfCurrency(roi.totalCumulativeSavings, sym) + '. ';
            }
        }

        if (results.waccValue > 0) {
            s += 'Card terms also free ' + this.pdfCurrency(results.freedWorkingCapital, sym) + ' in working capital (' + this.pdfCurrency(results.waccValue, sym) + '/yr at ' + results.wacc + '% WACC).';
        }

        return s;
    }

    /**
     * Get value driver note
     */
    getValueDriverNote(paymentType, savingsPercent) {
        if (typeof CONFIG === 'undefined' || !CONFIG.valueDrivers) return '';
        const dc = CONFIG.valueDrivers[paymentType];
        if (!dc) return '';
        if (savingsPercent <= 0) return dc.noSavings || 'No savings';
        const th = dc.thresholds || [];
        for (const t of th) {
            if (savingsPercent >= t.min && savingsPercent < t.max) return t.message;
        }
        return th.length > 0 ? th[th.length - 1].message : '';
    }

    /**
     * Add footer with Tungsten logo
     */
    addFooter(doc) {
        const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
        const footerY = this.pageHeight - 8;

        doc.setDrawColor(...this.colors.veryLightGray);
        doc.setLineWidth(0.5);
        doc.line(this.margin, footerY - 4, this.pageWidth - this.margin, footerY - 4);

        doc.setFontSize(7);
        doc.setTextColor(...this.colors.lightGray);
        doc.setFont(undefined, 'normal');
        doc.text(pdfText.footerTitle || 'Tungsten Pay+ Payments Optimisation Analysis', this.margin, footerY);

        doc.setFontSize(6);
        doc.text(pdfText.footerDisclaimer || 'This analysis is for informational purposes only. Actual savings may vary based on transaction volumes and patterns.',
            this.margin, footerY + 3);
    }
    /**
     * Generate Reseller Summary PDF (partner earnings only — NEVER shows margins/fees/costs)
     */
    async generateResellerPDF(results, options = {}) {
        const sym = results.currencySymbol;
        const upside = results.partnerUpside;
        if (!upside) throw new Error('No partner upside data');

        const { jsPDF } = window.jspdf;
        if (!jsPDF) throw new Error('jsPDF library not loaded');
        const doc = new jsPDF('p', 'mm', 'a4');

        let tungstenLogo = (typeof CONFIG !== 'undefined' && CONFIG.pdfLogos) ? CONFIG.pdfLogos.tungstenLogo : null;
        if (!tungstenLogo) tungstenLogo = await this.loadImageAsBase64('assets/tungsten_logo.jpg');

        let y = this.margin;

        // ── HEADER ──
        if (tungstenLogo) {
            try { doc.addImage(tungstenLogo, 'JPEG', this.pageWidth - this.margin - 50, y - 4, 50, 14); } catch(e) {}
        }
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.setFont(undefined, 'bold');
        doc.text('Partner Annual Summary', this.margin, y);
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.mediumGray);
        doc.setFont(undefined, 'normal');
        doc.text('Tungsten Pay+ Reseller Programme', this.margin, y + 5);
        doc.setFontSize(8);
        doc.setTextColor(...this.colors.lightGray);
        doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            this.margin, y + 10);
        y += 10;
        doc.setDrawColor(...this.colors.veryLightGray);
        doc.setLineWidth(0.5);
        doc.line(this.margin, y, this.pageWidth - this.margin, y);
        y += 6;

        // ── EARNINGS BREAKDOWN TABLE ──
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.primary);
        doc.setFont(undefined, 'bold');
        doc.text('Earnings Breakdown', this.margin, y);
        y += 6;

        // Table header
        doc.setFillColor(0, 40, 84);
        doc.rect(this.margin, y, this.contentWidth, 7, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('Mechanism', this.margin + 3, y + 5);
        doc.text('Annual Earnings', this.margin + this.contentWidth - 40, y + 5);
        doc.text('Notes', this.margin + this.contentWidth / 2, y + 5);
        y += 7;

        // Table rows
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        let rowIndex = 0;

        const addRow = (label, value, notes) => {
            if (rowIndex % 2 === 0) {
                doc.setFillColor(245, 247, 250);
                doc.rect(this.margin, y, this.contentWidth, 7, 'F');
            }
            doc.setTextColor(...this.colors.darkGray);
            doc.text(label, this.margin + 3, y + 5);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...this.colors.primary);
            doc.text(this.pdfCurrency(value, sym, 0), this.margin + this.contentWidth - 40, y + 5);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...this.colors.mediumGray);
            if (notes) doc.text(notes, this.margin + this.contentWidth / 2, y + 5);
            y += 7;
            rowIndex++;
        };

        if (upside.spiff.enabled) {
            addRow('SPIFF Bonus', upside.spiff.value, 'One-time per deal');
        }
        if (upside.bulkBuy.enabled) {
            addRow('Bulk Buy Margin Share', upside.bulkBuy.annualMarginShare || 0, 'Annual recurring');
        }
        if (upside.revenueShare.enabled) {
            addRow('Standard Revenue Share', upside.revenueShare.value, 'Annual recurring');
        }

        // Total row
        doc.setFillColor(0, 40, 84);
        doc.rect(this.margin, y, this.contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('TOTAL ANNUAL EARNINGS', this.margin + 3, y + 5.5);
        doc.text(this.pdfCurrency(upside.totalAnnualUpside, sym, 0), this.margin + this.contentWidth - 40, y + 5.5);
        y += 12;

        // ── BULK BUY ROI SECTION ──
        if (upside.bulkBuy.enabled) {
            doc.setFontSize(11);
            doc.setTextColor(...this.colors.primary);
            doc.setFont(undefined, 'bold');
            doc.text('Bulk Buy Investment Analysis', this.margin, y);
            y += 6;

            // ROI metrics in tiles
            const tileW = (this.contentWidth - 9) / 4;
            const tiles = [
                { label: 'Upfront Investment', value: this.pdfCurrency(upside.bulkBuy.upfrontCost, sym, 0) },
                { label: 'Annual Earnings', value: this.pdfCurrency(upside.bulkBuy.annualMarginShare || 0, sym, 0) },
                { label: 'ROI', value: `${(upside.bulkBuy.roiPercent || 0).toFixed(1)}%` },
                { label: 'Payback', value: upside.bulkBuy.paybackMonths ? `${upside.bulkBuy.paybackMonths} months` : 'N/A' }
            ];

            tiles.forEach((tile, i) => {
                const x = this.margin + i * (tileW + 3);
                doc.setFillColor(240, 245, 255);
                doc.roundedRect(x, y, tileW, 16, 2, 2, 'F');
                doc.setFontSize(7);
                doc.setTextColor(...this.colors.mediumGray);
                doc.setFont(undefined, 'normal');
                doc.text(tile.label, x + tileW / 2, y + 5, { align: 'center' });
                doc.setFontSize(10);
                doc.setTextColor(...this.colors.primary);
                doc.setFont(undefined, 'bold');
                doc.text(tile.value, x + tileW / 2, y + 12, { align: 'center' });
            });
            y += 20;

            // Ramp-up schedule visualization
            if (upside.bulkBuy.rampUpSchedule && upside.bulkBuy.rampUpSchedule.length > 0) {
                doc.setFontSize(9);
                doc.setTextColor(...this.colors.darkGray);
                doc.setFont(undefined, 'bold');
                doc.text('Customer Integration Ramp-Up', this.margin, y);
                y += 5;

                const totalLicenses = upside.bulkBuy.numberOfLicenses || 1;
                const qW = (this.contentWidth - 9) / 4;
                upside.bulkBuy.rampUpSchedule.forEach((active, i) => {
                    const x = this.margin + i * (qW + 3);
                    const fillPct = Math.min(active / totalLicenses, 1);
                    // Background
                    doc.setFillColor(240, 240, 240);
                    doc.roundedRect(x, y, qW, 12, 2, 2, 'F');
                    // Fill bar
                    if (fillPct > 0) {
                        const fillW = qW * fillPct;
                        doc.setFillColor(0, 40, 84);
                        doc.roundedRect(x, y, fillW, 12, 2, 2, 'F');
                    }
                    // Label
                    doc.setFontSize(7);
                    doc.setTextColor(255, 255, 255);
                    doc.setFont(undefined, 'bold');
                    if (fillPct > 0.3) {
                        doc.text(`Q${i + 1}: ${active}/${totalLicenses}`, x + 3, y + 8);
                    } else {
                        doc.setTextColor(...this.colors.darkGray);
                        doc.text(`Q${i + 1}: ${active}/${totalLicenses}`, x + 3, y + 8);
                    }
                });
                y += 16;
            }
        }

        // ── EARNINGS BY PAYMENT TYPE ──
        const breakdown = upside.bulkBuy.enabled ? upside.bulkBuy.breakdown :
            upside.revenueShare.enabled ? upside.revenueShare.breakdown : null;

        if (breakdown) {
            doc.setFontSize(11);
            doc.setTextColor(...this.colors.primary);
            doc.setFont(undefined, 'bold');
            doc.text('Earnings by Payment Type', this.margin, y);
            y += 6;

            // Table header
            doc.setFillColor(0, 40, 84);
            doc.rect(this.margin, y, this.contentWidth, 7, 'F');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text('Payment Type', this.margin + 3, y + 5);
            doc.text('Your Annual Earnings', this.margin + this.contentWidth - 50, y + 5);
            y += 7;

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            const types = [
                { label: 'Local Rail Payments', value: breakdown.localRail || 0 },
                { label: 'Cross-Border Payments', value: breakdown.crossBorder || 0 },
                { label: 'Foreign Exchange', value: breakdown.fx || 0 }
            ];
            const typeTotal = types.reduce((sum, t) => sum + t.value, 0);

            types.forEach((t, i) => {
                if (i % 2 === 0) {
                    doc.setFillColor(245, 247, 250);
                    doc.rect(this.margin, y, this.contentWidth, 7, 'F');
                }
                doc.setTextColor(...this.colors.darkGray);
                doc.text(t.label, this.margin + 3, y + 5);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...this.colors.primary);
                doc.text(this.pdfCurrency(t.value, sym, 0), this.margin + this.contentWidth - 50, y + 5);
                doc.setFont(undefined, 'normal');
                y += 7;
            });

            // Total
            doc.setFillColor(0, 40, 84);
            doc.rect(this.margin, y, this.contentWidth, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text('TOTAL', this.margin + 3, y + 5);
            doc.text(this.pdfCurrency(typeTotal, sym, 0), this.margin + this.contentWidth - 50, y + 5);
            y += 12;
        }

        // ── TOTAL HIGHLIGHT BOX ──
        doc.setFillColor(240, 245, 255);
        doc.roundedRect(this.margin, y, this.contentWidth, 20, 3, 3, 'F');
        doc.setDrawColor(0, 40, 84);
        doc.setLineWidth(0.5);
        doc.roundedRect(this.margin, y, this.contentWidth, 20, 3, 3, 'S');
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.mediumGray);
        doc.setFont(undefined, 'normal');
        doc.text('Total Annual Partner Earnings', this.contentWidth / 2 + this.margin, y + 7, { align: 'center' });
        doc.setFontSize(16);
        doc.setTextColor(...this.colors.primary);
        doc.setFont(undefined, 'bold');
        doc.text(this.pdfCurrency(upside.totalAnnualUpside, sym, 0), this.contentWidth / 2 + this.margin, y + 16, { align: 'center' });

        // ── FOOTER ──
        const footerY = this.pageHeight - 8;
        doc.setDrawColor(...this.colors.veryLightGray);
        doc.setLineWidth(0.5);
        doc.line(this.margin, footerY - 4, this.pageWidth - this.margin, footerY - 4);
        doc.setFontSize(7);
        doc.setTextColor(...this.colors.lightGray);
        doc.setFont(undefined, 'normal');
        doc.text('Tungsten Pay+ Partner Programme - Confidential', this.margin, footerY);
        doc.setFontSize(6);
        doc.text('This summary is for partner use only. Actual earnings may vary based on transaction volumes and customer integration timelines.',
            this.margin, footerY + 3);

        doc.save(`Tungsten_Reseller_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExporter;
}
