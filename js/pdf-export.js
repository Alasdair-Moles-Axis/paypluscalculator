/**
 * Tungsten Pay+ Payments Optimisation Analysis - PDF Export Module
 * Single-page format: Key Facts → Input Data → Cost Savings Summary → Simplified Table
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
            primary: [0, 40, 84],      // Prussian Blue #002854
            darkGray: [75, 85, 99],    // #4B5563
            mediumGray: [107, 114, 128], // #6B7280
            lightGray: [156, 163, 175], // #9CA3AF
            veryLightGray: [209, 213, 219], // #D1D5DB
            white: [255, 255, 255],
            black: [0, 0, 0]
        };
        
    }

    /**
     * Load image as base64 for jsPDF
     */
    async loadImageAsBase64(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/jpeg');
                resolve(dataURL);
            };
            
            img.onerror = function() {
                console.warn(`Could not load image: ${imagePath}`);
                resolve(null);
            };
            
            img.src = imagePath;
        });
    }

    /**
     * Generate and download single-page PDF report
     */
    async generatePDF(results) {
        try {
            // Validate results object - new structure
            if (!results || !results.data || !results.costs || !results.incentives || !results.detailedCosts) {
                throw new Error('Invalid results object structure');
            }

            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF library not loaded');
            }

            const doc = new jsPDF('p', 'mm', 'a4');

            // Load logos - try config first, then load from files
            let payPlusLogo = null;
            let tungstenLogo = (typeof CONFIG !== 'undefined' && CONFIG.pdfLogos) ? CONFIG.pdfLogos.tungstenLogo : null;
            
            // If not in config, load from file paths
            if (!tungstenLogo) {
                tungstenLogo = await this.loadImageAsBase64('assets/tungsten_logo.jpg');
            }
    
            
            console.log('Pay+ logo loaded:', payPlusLogo ? 'yes' : 'no');
            console.log('Tungsten logo loaded:', tungstenLogo ? 'yes' : 'no');

            let yPosition = this.margin;

            // Header (with Pay+ logo)
            yPosition = this.addHeader(doc, yPosition, payPlusLogo);

            // Placeholder Text Section
            yPosition = this.addPlaceholderText(doc, yPosition);

            // Combined Key Facts Section (includes input data)
            yPosition = this.addCombinedKeyFacts(doc, yPosition, results);

            // Cost Savings Summary
            yPosition = this.addCostSavingsSummary(doc, yPosition, results);

            // Simplified Table
            yPosition = this.addSimplifiedTable(doc, yPosition, results);

            // Footer (with Tungsten logo)
            this.addFooter(doc, tungstenLogo);

            // Generate filename
            const filename = `Tungsten_Payments_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;

            // Save PDF
            doc.save(filename);

            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }


    /**
     * Add compact header with Pay+ logo
     */
    addHeader(doc, yPosition, payPlusLogo) {
        // Get config with fallback
        const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
        
        // Title
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.setFont(undefined, 'bold');
        doc.text(pdfText.title || 'Tungsten Pay+', this.margin, yPosition);
        
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.mediumGray);
        doc.setFont(undefined, 'normal');
        doc.text(pdfText.subtitle || 'Payments optimisation analysis', this.margin, yPosition + 5);
        
        // Date (below logo if present, otherwise top right)
        doc.setFontSize(8);
        doc.setTextColor(...this.colors.lightGray);
        const dateText = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const dateY = payPlusLogo ? yPosition + 12 : yPosition;
        doc.text(dateText, this.pageWidth - this.margin, dateY, { align: 'right' });
        
        yPosition += 10;
        
        // Divider
        doc.setDrawColor(...this.colors.veryLightGray);
        doc.setLineWidth(0.5);
        doc.line(this.margin, yPosition, this.pageWidth - this.margin, yPosition);
        yPosition += 6;

        return yPosition;
    }

    /**
     * Add placeholder text section
     */
    addPlaceholderText(doc, yPosition) {
        const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
        
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.darkGray);
        doc.setFont(undefined, 'normal');
        
        const placeholderText = pdfText.placeholderText || 'Pay+ seamlessly enables the completion of the invoice-to-pay lifecycle through modern payments orchestration for flexibility and economical transactions.';
        
        const lines = doc.splitTextToSize(placeholderText, this.contentWidth);
        lines.forEach(line => {
            doc.text(line, this.margin, yPosition);
            yPosition += 4;
        });
        
        yPosition += 4;
        return yPosition;
    }

    /**
     * Add combined key facts section (includes input data)
     */
    addCombinedKeyFacts(doc, yPosition, results) {
        const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
        const labels = pdfText.keyFactsLabels || {};
        
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.black);
        doc.setFont(undefined, 'bold');
        doc.text(pdfText.keyFactsTitle || 'What you have told us', this.margin, yPosition);
        yPosition += 7;

        const data = results.data.customerInfo;
        const lineHeight = 6;
        const leftCol = this.margin;
        const rightCol = this.margin + (this.contentWidth / 2) + 2;
        
        // Setup for two-column layout
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.darkGray);
        doc.setFont(undefined, 'normal');
        
        let leftY = yPosition;
        let rightY = yPosition;
        
        // LEFT COLUMN
        const indent1 = 5; // First level indent (mm)
        const indent2 = 10; // Second level indent (mm)
        const indent3 = 15; // Third level indent (mm)
        
        doc.text(`${labels.currency || 'Base currency'}: ${data.currency}`, leftCol, leftY);
        leftY += lineHeight;
        
        doc.text(`${labels.totalPaymentVolume || 'Total payment volume (yearly)'}: ${FormatUtils.formatCurrency(data.totalPaymentValue, 0, results.currencySymbol)}`, leftCol, leftY);
        leftY += lineHeight;
        
        doc.text(`${labels.annualPayments || 'Annual payments amount (yearly)'}: ${FormatUtils.formatNumber(data.totalPaymentCount, 0)}`, leftCol, leftY);
        leftY += lineHeight;
        
        doc.text(`${labels.railPayments || 'Bank payments (%)'}: ${data.paymentMethodDistribution.railPercent}%`, leftCol + indent1, leftY);
        leftY += lineHeight;
        
        doc.text(`${labels.localRail || 'Local payment method (%)'}: ${data.paymentTypeDistribution.localPercent}%`, leftCol + indent2, leftY);
        leftY += lineHeight;
        
        doc.text(`${labels.crossBorderRail || 'Cross-border payment method (%)'}: ${data.paymentTypeDistribution.crossBorderPercent}%`, leftCol + indent2, leftY);
        leftY += lineHeight;
        
        doc.text(`${labels.fxPercentOfCrossBorder || 'Portion of cross-border requiring FX (%)'}: ${data.fxPercentOfCrossBorder}%`, leftCol + indent3, leftY);
        leftY += lineHeight;

        doc.text(`${labels.cardPayments || 'Card payments (%)'}: ${data.paymentMethodDistribution.cardPercent}%`, leftCol + indent1, leftY);
        leftY += lineHeight;
        
        // RIGHT COLUMN
        doc.text(`${labels.currentLocalPaymentFee || 'Current local payment fee'}: ${results.currencySymbol}${results.data.fees.currentProvider.localRailFee}`, rightCol, rightY);
        rightY += lineHeight;
        
        doc.text(`${labels.currentCrossBorderPaymentFee || 'Current cross-border payment fee'}: ${results.currencySymbol}${results.data.fees.currentProvider.crossBorderFee}`, rightCol, rightY);
        rightY += lineHeight;
        
        doc.text(`${labels.currentFxMarginTier1 || 'Current FX margin (0-100k)'}: ${results.data.fees.currentProvider.fxMargins.tier1}%`, rightCol, rightY);
        rightY += lineHeight;
        
        doc.text(`${labels.currentFxMarginTier2 || 'Current FX margin (100k-500k)'}: ${results.data.fees.currentProvider.fxMargins.tier2}%`, rightCol, rightY);
        rightY += lineHeight;
        
        doc.text(`${labels.currentFxMarginTier3 || 'Current FX margin (>500k)'}: ${results.data.fees.currentProvider.fxMargins.tier3}%`, rightCol, rightY);
        rightY += lineHeight;
        
        doc.text(`${labels.currentCardRebate || 'Current card rebate'}: ${results.data.fees.currentProvider.cardRebate}%`, rightCol, rightY);
        rightY += lineHeight;
        
        // Use the maximum Y position from both columns
        yPosition = Math.max(leftY, rightY) + 2;
        
        // Current Annual Cost (BOLD) - full width
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.black);
        doc.text(`${labels.currentAnnualCost || '> Current Annual Cost'}: ${FormatUtils.formatCurrency(results.costs.current, 0, results.currencySymbol)}`, this.margin, yPosition);
        yPosition += lineHeight;
        
        // Tungsten Annual Cost (BOLD) - full width
        doc.setTextColor(...this.colors.primary);
        doc.text(`${labels.tungstenAnnualCost || '> Tungsten Annual Cost'}: ${FormatUtils.formatCurrency(results.costs.tungsten, 0, results.currencySymbol)}`, this.margin, yPosition);
        yPosition += 10;

        return yPosition;
    }

    /**
     * Draw a fact box
     */
    drawFactBox(doc, x, y, width, height, label, value, color, isBold = false) {
        // Border - thicker if bold
        doc.setDrawColor(...this.colors.veryLightGray);
        doc.setLineWidth(isBold ? 1 : 0.5);
        doc.roundedRect(x, y, width, height, 1.5, 1.5);

        // Label
        doc.setFontSize(8);
        doc.setTextColor(...this.colors.mediumGray);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        doc.text(label, x + 3, y + 5);

        // Value - larger if bold
        doc.setFontSize(isBold ? 15 : 13);
        doc.setTextColor(...color);
        doc.setFont(undefined, 'bold');
        doc.text(value, x + 3, y + 13);
    }

    /**
     * Add cost savings summary - REMOVED (moved to after transaction cost table)
     */
    addCostSavingsSummary(doc, yPosition, results) {
        // This method is now empty - the summary is added in addSimplifiedTable
        return yPosition;
    }

    /**
     * Add two separate tables: transaction costs and card incentives
     */
    addSimplifiedTable(doc, yPosition, results) {
        const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
        const paymentLabels = pdfText.paymentTypeLabels || {};
        
        // TABLE 1: Transaction costs (Rails + FX)
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.black);
        doc.setFont(undefined, 'bold');
        doc.text('Transaction cost savings', this.margin, yPosition);
        yPosition += 6;

        const colWidths = [28, 26, 26, 18, 88];
        const rowHeight = 8;
        let xPos = this.margin;

        // Cost table header
        doc.setFillColor(...this.colors.veryLightGray);
        doc.rect(this.margin, yPosition, this.contentWidth, rowHeight, 'F');
        
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...this.colors.black);
        
        const costHeaders = ['Payment type', 'Current cost', 'Tungsten cost', '% savings', 'Value driver'];
        costHeaders.forEach((header, i) => {
            doc.text(header, xPos + 2, yPosition + 4.5);
            xPos += colWidths[i];
        });
        yPosition += rowHeight;

        // Cost rows
        const costRows = [
            {
                type: 'Local rail',
                current: results.detailedCosts.current.localRail,
                tungsten: results.detailedCosts.tungsten.localRail,
                savings: results.costs.savings.localRail,
                driver: 'localRail'
            },
            {
                type: 'Cross-border',
                current: results.detailedCosts.current.crossBorderRail,
                tungsten: results.detailedCosts.tungsten.crossBorderRail,
                savings: results.costs.savings.crossBorderRail,
                driver: 'crossBorder'
            },
            {
                type: 'FX',
                current: results.detailedCosts.current.fx.total,
                tungsten: results.detailedCosts.tungsten.fx.total,
                savings: results.costs.savings.fx,
                driver: 'fx'
            }
        ];

        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        
        costRows.forEach((row, index) => {
            xPos = this.margin;
            
            if (index % 2 === 1) {
                doc.setFillColor(250, 250, 250);
                doc.rect(this.margin, yPosition, this.contentWidth, rowHeight, 'F');
            }

            doc.setTextColor(...this.colors.black);
            doc.text(row.type, xPos + 2, yPosition + 4.5);
            xPos += colWidths[0];
            
            doc.text(FormatUtils.formatCurrency(row.current, 0, results.currencySymbol), xPos + 2, yPosition + 4.5);
            xPos += colWidths[1];
            
            doc.text(FormatUtils.formatCurrency(row.tungsten, 0, results.currencySymbol), xPos + 2, yPosition + 4.5);
            xPos += colWidths[2];
            
            const percentSaved = row.current > 0 ? ((row.savings / row.current) * 100) : 0;
            doc.setTextColor(...this.colors.primary);
            doc.setFont(undefined, 'bold');
            doc.text(FormatUtils.formatPercent(percentSaved, 1), xPos + 2, yPosition + 4.5);
            xPos += colWidths[3];
            
            doc.setTextColor(...this.colors.mediumGray);
            doc.setFont(undefined, 'normal');
            const note = this.getValueDriverNote(row.driver, percentSaved);
            doc.text(note, xPos + 2, yPosition + 4.5, { maxWidth: colWidths[4] - 4 });
            
            yPosition += rowHeight;
        });

        // Cost total row
        xPos = this.margin;
        doc.setFillColor(...this.colors.primary);
        doc.rect(this.margin, yPosition, this.contentWidth, rowHeight, 'F');
        
        doc.setTextColor(...this.colors.white);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL COSTS', xPos + 2, yPosition + 4.5);
        xPos += colWidths[0];
        
        doc.text(FormatUtils.formatCurrency(results.costs.current, 0, results.currencySymbol), xPos + 2, yPosition + 4.5);
        xPos += colWidths[1];
        
        doc.text(FormatUtils.formatCurrency(results.costs.tungsten, 0, results.currencySymbol), xPos + 2, yPosition + 4.5);
        xPos += colWidths[2];
        
        doc.text(FormatUtils.formatPercent(results.costs.savingsPercentage, 1), xPos + 2, yPosition + 4.5);
        
        yPosition += rowHeight + 10;

        // TABLE 2: Card incentives (moved before total annual benefit)
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.black);
        doc.setFont(undefined, 'bold');
        doc.text('Card incentive differential', this.margin, yPosition);
        yPosition += 6;

        // Incentive table header
        xPos = this.margin;
        doc.setFillColor(...this.colors.veryLightGray);
        doc.rect(this.margin, yPosition, this.contentWidth, rowHeight, 'F');
        
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...this.colors.black);
        
        const incentiveHeaders = ['Payment type', 'Current incentive', 'Tungsten incentive', '% increase', 'Value driver'];
        incentiveHeaders.forEach((header, i) => {
            doc.text(header, xPos + 2, yPosition + 4.5);
            xPos += colWidths[i];
        });
        yPosition += rowHeight;

        // Incentive row
        xPos = this.margin;
        doc.setFillColor(250, 250, 250);
        doc.rect(this.margin, yPosition, this.contentWidth, rowHeight, 'F');
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...this.colors.black);
        doc.text('Card rebates', xPos + 2, yPosition + 4.5);
        xPos += colWidths[0];
        
        doc.text(FormatUtils.formatCurrency(results.incentives.current, 0, results.currencySymbol), xPos + 2, yPosition + 4.5);
        xPos += colWidths[1];
        
        doc.text(FormatUtils.formatCurrency(results.incentives.tungsten, 0, results.currencySymbol), xPos + 2, yPosition + 4.5);
        xPos += colWidths[2];
        
        doc.setTextColor(...this.colors.primary);
        doc.setFont(undefined, 'bold');
        doc.text(FormatUtils.formatPercent(results.incentives.increasePercentage, 1), xPos + 2, yPosition + 4.5);
        xPos += colWidths[3];
        
        doc.setTextColor(...this.colors.mediumGray);
        doc.setFont(undefined, 'normal');
        const cardNote = this.getValueDriverNote('cards', Math.abs(results.incentives.increasePercentage));
        doc.text(cardNote, xPos + 2, yPosition + 4.5, { maxWidth: colWidths[4] - 4 });
        
        yPosition += rowHeight + 10;

        // TOTAL ANNUAL BENEFIT BOX (after both tables)
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.black);
        doc.setFont(undefined, 'bold');
        doc.text('Total annual benefit', this.margin, yPosition);
        yPosition += 6;

        // Large savings box
        const boxHeight = 22;
        doc.setFillColor(...this.colors.primary);
        doc.roundedRect(this.margin, yPosition, this.contentWidth, boxHeight, 2, 2, 'F');

        // Total benefit amount
        doc.setTextColor(...this.colors.white);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Your total annual benefit', this.margin + 4, yPosition + 6);
        
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(FormatUtils.formatCurrency(results.totalAnnualBenefit, 0, results.currencySymbol),
                 this.margin + 4, yPosition + 15);

        // Breakdown
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const costSavings = FormatUtils.formatCurrency(results.costs.savings.total, 0, results.currencySymbol);
        const incentiveDiff = FormatUtils.formatCurrency(results.incentives.differential, 0, results.currencySymbol);
        doc.text(`Cost savings: ${costSavings} + Incentive differential: ${incentiveDiff}`, this.margin + 4, yPosition + 20);

        yPosition += boxHeight + 10;
        return yPosition;
    }

    /**
     * Get value driver note based on payment type and savings percentage
     */
    getValueDriverNote(paymentType, savingsPercent) {
        // Check if CONFIG is defined
        if (typeof CONFIG === 'undefined' || !CONFIG.valueDrivers) {
            return 'Value driver information not available';
        }
        
        const driverConfig = CONFIG.valueDrivers[paymentType];
        
        if (!driverConfig) {
            return 'Value driver information not available';
        }
        
        // Handle no savings case
        if (savingsPercent <= 0) {
            return driverConfig.noSavings || 'No savings in this category';
        }
        
        // Find matching threshold
        const thresholds = driverConfig.thresholds || [];
        
        for (let i = 0; i < thresholds.length; i++) {
            const threshold = thresholds[i];
            if (savingsPercent >= threshold.min && savingsPercent < threshold.max) {
                return threshold.message;
            }
        }
        
        // If no threshold matched (e.g., exactly 100%), use the last threshold
        if (thresholds.length > 0) {
            return thresholds[thresholds.length - 1].message;
        }
        
        return 'Value driver information not available';
    }

    /**
     * Add footer with Tungsten logo
     */
    addFooter(doc, tungstenLogo) {
        const pdfText = (typeof CONFIG !== 'undefined' && CONFIG.pdfText) ? CONFIG.pdfText : {};
        const footerY = this.pageHeight - 8;
        
        // Footer line
        doc.setDrawColor(...this.colors.veryLightGray);
        doc.setLineWidth(0.5);
        doc.line(this.margin, footerY - 4, this.pageWidth - this.margin, footerY - 4);
        
        // Footer text
        doc.setFontSize(7);
        doc.setTextColor(...this.colors.lightGray);
        doc.setFont(undefined, 'normal');
        doc.text(pdfText.footerTitle || 'Tungsten Pay+ Payments Optimisation Analysis', this.margin, footerY);
        
        // Disclaimer
        doc.setFontSize(6);
        doc.text(pdfText.footerDisclaimer || 'This analysis is for informational purposes only. Actual savings may vary based on transaction volumes and patterns.',
                this.margin, footerY + 3);
        
        // Tungsten logo (bottom center, like letterhead)
        if (tungstenLogo) {
            const logoWidth = 40;
            const logoHeight = 10;
            const logoX = (this.pageWidth - logoWidth) / 2;
            const logoY = this.pageHeight - 15;
            try {
                doc.addImage(tungstenLogo, 'JPEG', logoX, logoY, logoWidth, logoHeight);
            } catch (e) {
                console.warn('Could not add Tungsten logo to PDF:', e);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExporter;

}

