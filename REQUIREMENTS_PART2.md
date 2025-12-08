# Tungsten Pay+ Requirements - Part 2 (Continued)

## REQ-033: Editable Percentages (Continued)
**Topic**: Direct Percentage Input  
**User Story**: As a sales analyst, I want to click on percentages to edit them directly so that I can input precise values quickly.

**Functional Requirements**:
- System shall make percentage displays editable on click
- System shall select all text on focus
- System shall validate input as 0-100 range
- System shall update corresponding slider
- System shall trigger recalculation
- System shall restore original value if invalid
- System shall support Enter key to confirm

**Acceptance Criteria**:
- ✓ Clicking percentage makes it editable
- ✓ Text selected automatically
- ✓ Only numbers and decimal point allowed
- ✓ Values outside 0-100 rejected
- ✓ Slider updates to match entered value
- ✓ Invalid entries restore previous value
- ✓ Enter key confirms, Escape cancels

---

### REQ-034: Monochrome Design System
**Topic**: Consistent Visual Design  
**User Story**: As a user, I want a professional, consistent design so that the tool looks polished and trustworthy.

**Functional Requirements**:
- System shall use Prussian Blue (#002854) as primary brand color
- System shall use grayscale palette for all other elements
- System shall avoid using multiple colors
- System shall apply consistent spacing (4px increments)
- System shall use Aptos font family with fallbacks
- System shall use consistent border radius (6-16px)
- System shall apply smooth transitions (150-300ms)

**Acceptance Criteria**:
- ✓ Primary color: Prussian Blue (#002854)
- ✓ Grays: #F9FAFB to #111827 (9 shades)
- ✓ No other colors used (except semantic: success/error/warning)
- ✓ Spacing follows 4px grid
- ✓ Aptos font used throughout
- ✓ Border radius consistent
- ✓ Transitions smooth and consistent

---

### REQ-035: Accessibility Features
**Topic**: WCAG Compliance  
**User Story**: As a user with accessibility needs, I want the tool to be usable with assistive technologies so that I can perform my work effectively.

**Functional Requirements**:
- System shall provide ARIA labels for all interactive elements
- System shall support keyboard navigation
- System shall provide screen reader announcements
- System shall maintain sufficient color contrast (4.5:1 minimum)
- System shall provide focus indicators
- System shall support tab navigation
- System shall provide role attributes

**Acceptance Criteria**:
- ✓ All buttons have aria-label or aria-labelledby
- ✓ Tab key navigates through interactive elements
- ✓ Screen reader announcements for dynamic content
- ✓ Color contrast meets WCAG AA standards
- ✓ Focus indicators visible and clear
- ✓ Tab order logical
- ✓ Role attributes present (tablist, tab, tabpanel, etc.)

---

## 9. Configuration & Customization

### REQ-036: Centralized Configuration
**Topic**: Config-Driven Architecture  
**User Story**: As an administrator, I want all configurable settings in one place so that I can customize the tool without modifying code.

**Functional Requirements**:
- System shall provide [`config.js`](config.js:1) file for all settings
- System shall support configuration of:
  - Value driver messages (3 tiers × 4 payment types)
  - PDF logos (base64 strings)
  - PDF text (all labels and messages)
  - Brand colors
  - Default fees
  - UI labels
  - Application settings
- System shall use safe fallbacks if config missing
- System shall validate config on load

**Acceptance Criteria**:
- ✓ Single config.js file contains all settings
- ✓ Value drivers configurable (12 messages + 4 no-savings)
- ✓ PDF logos configurable (2 logos)
- ✓ PDF text fully configurable (30+ strings)
- ✓ Colors configurable
- ✓ Default fees configurable
- ✓ System functions with missing config
- ✓ Invalid config doesn't break system

---

### REQ-037: Value Driver Configuration
**Topic**: Threshold-Based Messaging  
**User Story**: As an administrator, I want to configure value driver messages so that I can tailor explanations to different savings levels.

**Functional Requirements**:
- System shall support 3-tier threshold system per payment type
- System shall define thresholds as min/max percentage ranges
- System shall provide message for each threshold
- System shall provide no-savings message
- System shall support 4 payment types: localRail, crossBorder, fx, cards
- System shall validate threshold ranges don't overlap
- System shall use messages in PDF export

**Acceptance Criteria**:
- ✓ Config structure: [`config.valueDrivers.{paymentType}.thresholds[]`](config.js:9)
- ✓ Each threshold has min, max, message
- ✓ Three thresholds per payment type
- ✓ No-savings message per payment type
- ✓ 16 total messages configurable
- ✓ Thresholds validated (no gaps/overlaps)
- ✓ Messages appear in PDF table

---

### REQ-038: PDF Text Configuration
**Topic**: Complete PDF Customization  
**User Story**: As an administrator, I want to customize all PDF text so that I can adapt the report for different markets or use cases.

**Functional Requirements**:
- System shall make all PDF text configurable via [`config.pdfText`](config.js:55)
- System shall support configuration of:
  - Header (title, subtitle)
  - Placeholder text
  - Key Facts section (title, 16 labels)
  - Savings summary (title, label, suffix)
  - Table (4 headers, 5 payment type labels)
  - Footer (title, disclaimer)
- System shall use fallback values if config missing
- System shall support multi-line text

**Acceptance Criteria**:
- ✓ All PDF text in config.pdfText object
- ✓ 30+ configurable strings
- ✓ Fallback values provided
- ✓ Multi-line text supported
- ✓ Changes reflected immediately in PDF
- ✓ No hardcoded strings in PDF generation code

---

### REQ-039: Logo Configuration
**Topic**: Brand Logo Management  
**User Story**: As an administrator, I want to configure company logos so that PDFs are properly branded.

**Functional Requirements**:
- System shall support two logo configurations in [`config.pdfLogos`](config.js:48)
- System shall accept base64-encoded PNG strings
- System shall support payPlusLogo (header) and tungstenLogo (footer)
- System shall handle null/missing logos gracefully
- System shall provide instructions for logo conversion
- System shall log warnings for logo errors

**Acceptance Criteria**:
- ✓ Two logo fields: payPlusLogo, tungstenLogo
- ✓ Base64 PNG strings accepted
- ✓ Null values allowed (logos optional)
- ✓ PDF generates without logos if not configured
- ✓ Comments explain how to convert logos
- ✓ Console warnings for invalid logos

---

### REQ-040: Default Fee Configuration
**Topic**: Preset Fee Structures  
**User Story**: As an administrator, I want to configure default fees so that the tool starts with appropriate values for my market.

**Functional Requirements**:
- System shall support default Tungsten fees in [`config.defaultTungstenFees`](config.js:122)
- System shall support default current provider fees
- System shall apply defaults on first load
- System shall allow user override of defaults
- System shall persist user-modified fees
- System shall provide reset to defaults option

**Acceptance Criteria**:
- ✓ Default Tungsten fees configurable
- ✓ Default current provider fees configurable
- ✓ Defaults applied on initial load
- ✓ Users can modify fees
- ✓ Modified fees persist in localStorage
- ✓ Reset option available (future enhancement)

---

### REQ-041: Application Settings
**Topic**: Behavioral Configuration  
**User Story**: As an administrator, I want to configure application behavior so that I can optimize performance and UX.

**Functional Requirements**:
- System shall support configuration in [`config.app`](config.js:142)
- System shall configure:
  - Auto-save interval (default: 30000ms)
  - Calculation debounce (default: 800ms)
  - Version number
- System shall apply settings on initialization
- System shall validate settings are positive numbers

**Acceptance Criteria**:
- ✓ Auto-save interval configurable
- ✓ Calculation debounce configurable
- ✓ Version number configurable
- ✓ Settings applied at startup
- ✓ Invalid settings use safe defaults
- ✓ Settings affect actual behavior

---

## 10. Security & Access Control

### REQ-042: Hidden Settings Access
**Topic**: Tungsten Fee Protection  
**User Story**: As an administrator, I want Tungsten fees hidden by default so that sales analysts can't easily modify our pricing.

**Functional Requirements**:
- System shall hide Tungsten fee settings by default
- System shall require triple-click on logo to reveal settings
- System shall persist visibility state in localStorage
- System shall provide toast notification on unlock/hide
- System shall allow collapsible section when visible
- System shall not encrypt or password-protect (client-side only)

**Acceptance Criteria**:
- ✓ Settings hidden on initial load
- ✓ Triple-click logo toggles visibility
- ✓ State persists across sessions
- ✓ Toast confirms unlock/hide action
- ✓ Collapsible header when visible
- ✓ No server-side authentication required

---

### REQ-043: Data Privacy
**Topic**: Local Data Storage  
**User Story**: As a user, I want my data stored locally so that sensitive customer information doesn't leave my device.

**Functional Requirements**:
- System shall store all data in browser localStorage only
- System shall not transmit data to external servers
- System shall not use cookies
- System shall not track user behavior
- System shall allow data export (JSON)
- System shall allow data import (JSON)
- System shall provide clear data deletion

**Acceptance Criteria**:
- ✓ All data in localStorage
- ✓ No network requests for data storage
- ✓ No cookies used
- ✓ No analytics tracking
- ✓ Export to JSON file supported
- ✓ Import from JSON file supported
- ✓ Clear all data option available

---

### REQ-044: Input Sanitization
**Topic**: XSS Prevention  
**User Story**: As a system, I need to sanitize inputs so that malicious code cannot be injected.

**Functional Requirements**:
- System shall validate all numeric inputs
- System shall reject non-numeric characters (except decimal point)
- System shall escape HTML in text inputs
- System shall validate percentage ranges
- System shall prevent script injection
- System shall sanitize before localStorage storage

**Acceptance Criteria**:
- ✓ Numeric inputs accept only numbers and decimal
- ✓ HTML characters escaped
- ✓ Percentages validated 0-100
- ✓ Script tags rejected
- ✓ Stored data sanitized
- ✓ No XSS vulnerabilities

---

## 11. Technical Architecture

### REQ-045: Modular Code Structure
**Topic**: Code Organization  
**User Story**: As a developer, I want modular code so that I can maintain and extend the system easily.

**Functional Requirements**:
- System shall separate concerns into modules:
  - [`calculator.js`](calculator.js:1) - Calculation logic
  - [`charts.js`](charts.js:1) - Chart management
  - [`storage.js`](storage.js:1) - Data persistence
  - [`pdf-export.js`](pdf-export.js:1) - PDF generation
  - [`app.js`](app.js:1) - Application coordination
  - [`config.js`](config.js:1) - Configuration
- System shall use class-based architecture
- System shall avoid global variables (except app instance)
- System shall use clear naming conventions

**Acceptance Criteria**:
- ✓ Six separate JavaScript modules
- ✓ Each module has single responsibility
- ✓ Classes used for encapsulation
- ✓ Minimal global scope pollution
- ✓ Consistent naming (camelCase)
- ✓ Clear module boundaries

---

### REQ-046: Calculation Performance
**Topic**: Efficient Computation  
**User Story**: As a user, I want calculations to complete quickly so that the interface feels responsive.

**Functional Requirements**:
- System shall complete calculations within 50ms
- System shall use debouncing (800ms) to reduce calculation frequency
- System shall perform calculations asynchronously
- System shall update UI progressively
- System shall avoid unnecessary recalculations
- System shall cache intermediate results where appropriate

**Acceptance Criteria**:
- ✓ Calculation time < 50ms
- ✓ Debounce delay 800ms
- ✓ Async calculation with setTimeout
- ✓ UI updates don't block
- ✓ Calculations only when inputs change
- ✓ No redundant calculations

---

### REQ-047: Chart Performance
**Topic**: Smooth Visualizations  
**User Story**: As a user, I want charts to update smoothly so that the interface feels polished.

**Functional Requirements**:
- System shall use Chart.js library for visualizations
- System shall update charts with transitions (300ms)
- System shall resize charts responsively
- System shall destroy and recreate charts when needed
- System shall use efficient update methods
- System shall handle missing data gracefully

**Acceptance Criteria**:
- ✓ Chart.js 4.4.0 used
- ✓ Transitions smooth (300ms)
- ✓ Charts resize on window resize
- ✓ No memory leaks from chart instances
- ✓ Update method used (not recreate)
- ✓ Empty data doesn't break charts

---

### REQ-048: Browser Compatibility
**Topic**: Cross-Browser Support  
**User Story**: As a user, I want the tool to work in my browser so that I can use it without technical issues.

**Functional Requirements**:
- System shall support modern browsers:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- System shall use standard JavaScript (ES6+)
- System shall provide fallbacks for missing features
- System shall test localStorage availability
- System shall handle browser-specific quirks

**Acceptance Criteria**:
- ✓ Works in Chrome 90+
- ✓ Works in Firefox 88+
- ✓ Works in Safari 14+
- ✓ Works in Edge 90+
- ✓ ES6+ features used appropriately
- ✓ localStorage fallback provided
- ✓ No browser-specific bugs

---

### REQ-049: Error Handling
**Topic**: Graceful Failure  
**User Story**: As a user, I want clear error messages so that I can understand and fix problems.

**Functional Requirements**:
- System shall catch and handle all errors
- System shall display user-friendly error messages
- System shall log technical details to console
- System shall prevent application crashes
- System shall provide recovery options
- System shall validate data before operations

**Acceptance Criteria**:
- ✓ Try-catch blocks around critical code
- ✓ Error messages clear and actionable
- ✓ Console logs include stack traces
- ✓ Errors don't crash application
- ✓ Users can continue after errors
- ✓ Validation prevents most errors

---

### REQ-050: Dependencies Management
**Topic**: External Libraries  
**User Story**: As a developer, I want minimal dependencies so that the tool is lightweight and maintainable.

**Functional Requirements**:
- System shall use only essential external libraries:
  - Chart.js 4.4.0 (visualization)
  - jsPDF 2.5.1 (PDF generation)
  - html2canvas 1.4.1 (PDF screenshots - if needed)
- System shall load libraries from CDN
- System shall handle library loading failures
- System shall minimize total bundle size

**Acceptance Criteria**:
- ✓ Only 2-3 external libraries used
- ✓ Libraries loaded from reliable CDN
- ✓ Fallback if CDN fails
- ✓ Total page size < 500KB
- ✓ No unnecessary dependencies
- ✓ Libraries up to date

---

## 12. Future Enhancements (Not Currently Implemented)

### REQ-051: Multi-Language Support
**Topic**: Internationalization  
**User Story**: As a user in a non-English market, I want the tool in my language so that I can use it effectively.

**Functional Requirements** (Future):
- System should support multiple languages
- System should detect browser language
- System should allow manual language selection
- System should translate all UI text
- System should translate PDF content
- System should handle currency formatting per locale

**Acceptance Criteria** (Future):
- Languages supported: EN, FR, DE, ES, etc.
- Auto-detection works
- Manual override available
- All text translated
- PDF in selected language
- Currency formats correct per locale

---

### REQ-052: Advanced Scenarios
**Topic**: Complex Modeling  
**User Story**: As a sales analyst, I want to model complex scenarios so that I can handle edge cases.

**Functional Requirements** (Future):
- System should support volume discounts
- System should support seasonal variations
- System should support multiple customer segments
- System should support what-if analysis
- System should support scenario comparison
- System should support custom fee structures

**Acceptance Criteria** (Future):
- Volume tiers configurable
- Seasonal patterns supported
- Segment-specific pricing
- What-if scenarios saveable
- Side-by-side comparison
- Custom fee formulas

---

### REQ-053: Collaboration Features
**Topic**: Team Sharing  
**User Story**: As a sales analyst, I want to share calculations with colleagues so that we can collaborate.

**Functional Requirements** (Future):
- System should generate shareable links
- System should export to Excel
- System should support comments
- System should track versions
- System should support approval workflows
- System should integrate with CRM

**Acceptance Criteria** (Future):
- Shareable URLs generated
- Excel export with formulas
- Comments on calculations
- Version history maintained
- Approval process supported
- CRM integration available

---

## Appendix A: Technical Specifications

### File Structure
```
tungsten-roi-calculator/
├── index.html                 # Main HTML file
├── css/
│   └── styles.css            # All styles (monochrome design)
├── js/
│   ├── config.js             # Configuration (value drivers, PDF text, logos)
│   ├── calculator.js         # Calculation engine (ROICalculator class)
│   ├── charts.js             # Chart management (ChartsManager class)
│   ├── storage.js            # Data persistence (StorageManager class)
│   ├── pdf-export.js         # PDF generation (PDFExporter class)
│   └── app.js                # Main application (TungstenROIApp class)
├── assets/
│   └── logo.png              # Application logo
└── REQUIREMENTS.md           # This document
```

### Key Classes

**ROICalculator** ([`calculator.js`](calculator.js:6))
- Manages all calculation logic
- Handles currency conversion
- Validates input data
- Computes costs and savings
- Exports/imports data

**ChartsManager** ([`charts.js`](charts.js:6))
- Initializes Chart.js instances
- Updates chart data
- Manages chart lifecycle
- Handles responsive resizing
- Uses monochrome color palette

**StorageManager** ([`storage.js`](storage.js:6))
- Manages localStorage operations
- Handles auto-save (30s interval)
- Manages named calculations (max 10)
- Implements storage cleanup
- Provides import/export

**PDFExporter** ([`pdf-export.js`](pdf-export.js:7))
- Generates single-page A4 PDF
- Uses jsPDF library
- Implements monochrome design
- Supports configurable text
- Handles logo integration

**TungstenROIApp** ([`app.js`](app.js:6))
- Coordinates all modules
- Manages UI interactions
- Handles event listeners
- Controls application flow
- Implements debouncing

### Data Model

```javascript
{
  customerInfo: {
    currency: 'USD' | 'GBP' | 'EUR',
    totalPaymentValue: number,
    totalPaymentCount: number,
    paymentTypeDistribution: {
      localPercent: number,      // 0-100
      crossBorderPercent: number // 0-100
    },
    paymentMethodDistribution: {
      railPercent: number,        // 0-100
      cardPercent: number         // 0-100
    },
    fxPercentOfCrossBorder: number, // 0-100
    fxVolume: {
      distribution: {
        tier1Percent: number,     // 0-100
        tier2Percent: number,     // 0-100
        tier3Percent: number      // 0-100
      }
    }
  },
  fees: {
    tungsten: {
      localRailFee: number,       // $ per transaction
      crossBorderFee: number,     // $ per transaction
      fxMargins: {
        tier1: number,            // %
        tier2: number,            // %
        tier3: number             // %
      },
      cardInterchange: number     // %
    },
    currentProvider: {
      // Same structure as tungsten
    }
  }
}
```

### Configuration Schema

See [`config.js`](config.js:1) for complete configuration options:
- `valueDrivers` - Threshold-based messaging (16 messages)
- `pdfLogos` - Base64 logo strings (2 logos)
- `pdfText` - All PDF text (30+ strings)
- `colors` - Brand colors (Prussian Blue + grays)
- `defaultTungstenFees` - Default fee structure
- `labels` - UI labels
- `app` - Application settings

---

## Appendix B: Calculation Formulas

### Cost Calculations

**Local Rail Cost:**
```
localRailCost = localRailCount × localRailFee
```

**Cross-Border Rail Cost:**
```
crossBorderRailCost = crossBorderRailCount × crossBorderFee
```

**FX Cost:**
```
fxTier1Cost = fxTier1Volume × (fxMarginTier1 / 100)
fxTier2Cost = fxTier2Volume × (fxMarginTier2 / 100)
fxTier3Cost = fxTier3Volume × (fxMarginTier3 / 100)
fxTotalCost = fxTier1Cost + fxTier2Cost + fxTier3Cost
```

**Card Cost:**
```
cardCost = cardVolume × (cardInterchange / 100)
```

**Total Annual Cost:**
```
totalCost = localRailCost + crossBorderRailCost + fxTotalCost + cardCost
```

### Savings Calculations

**Savings by Type:**
```
localRailSavings = currentLocalRailCost - tungstenLocalRailCost
crossBorderSavings = currentCrossBorderCost - tungstenCrossBorderCost
fxSavings = currentFxCost - tungstenFxCost
cardSavings = currentCardCost - tungstenCardCost
```

**Total Savings:**
```
totalSavings = currentTotalCost - tungstenTotalCost
```

**Savings Percentage:**
```
savingsPercentage = (totalSavings / currentTotalCost) × 100
```

### Distribution Calculations

**Payment Method Split:**
```
railValue = totalPaymentValue × (railPercent / 100)
cardValue = totalPaymentValue × (cardPercent / 100)
railCount = totalPaymentCount × (railPercent / 100)
cardCount = totalPaymentCount - railCount
```

**Payment Geography Split (Rails Only):**
```
localRailValue = railValue × (localPercent / 100)
crossBorderRailValue = railValue × (crossBorderPercent / 100)
localRailCount = railCount × (localPercent / 100)
crossBorderRailCount = railCount - localRailCount
```

**FX Volume Calculation:**
```
fxTotalVolume = crossBorderRailValue × (fxPercentOfCrossBorder / 100)
fxTier1Volume = fxTotalVolume × (tier1Percent / 100)
fxTier2Volume = fxTotalVolume × (tier2Percent / 100)
fxTier3Volume = fxTotalVolume × (tier3Percent / 100)
```

---

## Appendix C: Value Driver Thresholds

### Default Threshold Configuration

**Local Rail:**
- 0-20%: "Some savings through Pay+ local routing optimization"
- 20-50%: "Significant savings through Pay+ optimized processing"
- 50-100%: "Exceptional savings from leveraging Pay+ payment economics"

**Cross-Border:**
- 0-20%: "Initial cross-border payment optimization with competitive rates"
- 20-50%: "Strong cross-border processing efficiency with superior routing"
- 50-100%: "Pay+ provides best-in-class cross-border rates and routing"

**FX:**
- 0-20%: "Competitive FX margins providing baseline savings across tiers"
- 20-50%: "Excellent FX pricing with substantial margin improvements"
- 50-100%: "Industry-leading FX rates delivering maximum savings across all transaction sizes"

**Cards:**
- 0-20%: "Improved card interchange rates through optimized processing"
- 20-50%: "Significant card processing savings via volume agreements and routing"
- 50-100%: "Exceptional card interchange value with best-in-class rates and processing"

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | System | Initial requirements documentation |

---

**End of Requirements Document**