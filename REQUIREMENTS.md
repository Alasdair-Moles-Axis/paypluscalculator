# Tungsten Pay+ Payments Optimisation Analysis - Requirements Documentation

## Document Information
- **Project**: Tungsten Pay+ ROI Calculator
- **Version**: 5.0
- **Last Updated**: 2025-12-08
- **Document Type**: Business & Functional Requirements

---

## Table of Contents
1. [Core Payment Input & Configuration](#1-core-payment-input--configuration)
2. [Payment Distribution & Allocation](#2-payment-distribution--allocation)
3. [Fee Management & Configuration](#3-fee-management--configuration)
4. [Calculation Engine](#4-calculation-engine)
5. [Results & Visualization](#5-results--visualization)
6. [Data Persistence & Management](#6-data-persistence--management)
7. [PDF Export & Reporting](#7-pdf-export--reporting)
8. [User Interface & Experience](#8-user-interface--experience)
9. [Configuration & Customization](#9-configuration--customization)
10. [Security & Access Control](#10-security--access-control)

---

## 1. Core Payment Input & Configuration

### REQ-001: Multi-Currency Support
**Topic**: Currency Management  
**User Story**: As a sales analyst, I want to perform calculations in multiple currencies (USD, GBP, EUR) so that I can present analyses to customers in their preferred currency.

**Functional Requirements**:
- System shall support three currencies: USD ($), GBP (£), EUR (€)
- System shall display appropriate currency symbols throughout the interface
- System shall convert all monetary values when currency is changed
- System shall apply exchange rates: USD=1.00, GBP=0.79, EUR=0.92
- System shall round converted values to 2 decimal places

**Acceptance Criteria**:
- ✓ Currency selector displays all three currency options with symbols
- ✓ Selecting a currency updates all monetary displays immediately
- ✓ Fee values are converted proportionally when currency changes
- ✓ PDF exports reflect the selected currency
- ✓ Currency symbol appears consistently across all UI elements

---

### REQ-002: Total Payment Volume Input
**Topic**: Payment Volume Configuration  
**User Story**: As a sales analyst, I want to input the customer's total annual payment volume so that I can calculate accurate savings based on their transaction scale.

**Functional Requirements**:
- System shall accept total annual payment value input
- System shall format numbers with comma separators for readability
- System shall support values up to billions
- System shall validate input as positive numeric values
- System shall update calculations automatically when value changes (800ms debounce)

**Acceptance Criteria**:
- ✓ Input field displays numbers with comma formatting (e.g., 50,000,000)
- ✓ Currency symbol prefix matches selected currency
- ✓ Invalid inputs are rejected with appropriate feedback
- ✓ Changes trigger recalculation after 800ms delay
- ✓ Default value of 50,000,000 is pre-populated

---

### REQ-003: Payment Count Input
**Topic**: Transaction Volume Configuration  
**User Story**: As a sales analyst, I want to input the total number of annual payments so that the system can calculate per-transaction costs and average transaction sizes.

**Functional Requirements**:
- System shall accept total payment count as integer input
- System shall format count with comma separators
- System shall calculate and display average transaction size automatically
- System shall validate input as positive integer
- System shall update dependent calculations when count changes

**Acceptance Criteria**:
- ✓ Input field displays count with comma formatting (e.g., 1,100,000)
- ✓ Average transaction size updates automatically: Total Value ÷ Total Count
- ✓ Average displays with 2 decimal places and currency symbol
- ✓ Invalid inputs are rejected
- ✓ Default value of 1,100,000 is pre-populated

---

## 2. Payment Distribution & Allocation

### REQ-004: Payment Method Distribution
**Topic**: Rail vs Card Split  
**User Story**: As a sales analyst, I want to split total payments between rail and card methods so that I can accurately model the customer's payment mix.

**Functional Requirements**:
- System shall provide dual-slider interface for rail/card split
- System shall default to 90% rail, 10% card distribution
- System shall allow adjustment from 0% to 100% for either method
- System shall calculate monetary values for each method automatically
- System shall support direct percentage editing via click-to-edit
- System shall display both percentage and monetary value for each method

**Acceptance Criteria**:
- ✓ Slider shows visual gradient: Prussian Blue (rail) to Gray (card)
- ✓ Left label shows rail percentage and amount
- ✓ Right label shows card percentage and amount
- ✓ Percentages always sum to 100%
- ✓ Clicking percentage allows direct numeric entry
- ✓ Values update in real-time as slider moves

---

### REQ-005: Payment Geography Distribution
**Topic**: Local vs Cross-Border Rail Split  
**User Story**: As a sales analyst, I want to split rail payments between local and cross-border so that I can apply different fee structures to each geography type.

**Functional Requirements**:
- System shall split ONLY rail payments (cards excluded from this split)
- System shall provide dual-slider for local/cross-border distribution
- System shall default to 60% local, 40% cross-border
- System shall calculate payment counts for each geography type
- System shall display percentage, amount, and payment count for each
- System shall support direct percentage editing

**Acceptance Criteria**:
- ✓ Description clearly states "cards are excluded"
- ✓ Calculations use only rail payment values
- ✓ Local rail shows: percentage, amount, payment count
- ✓ Cross-border rail shows: percentage, amount, payment count
- ✓ Slider gradient uses monochrome palette
- ✓ Percentages sum to 100%

---

### REQ-006: FX Payment Allocation
**Topic**: Foreign Exchange Payment Percentage  
**User Story**: As a sales analyst, I want to specify what percentage of cross-border rail payments involve FX so that I can accurately calculate FX-related costs.

**Functional Requirements**:
- System shall calculate FX volume as percentage of cross-border rail payments
- System shall provide slider for FX percentage (0-100%)
- System shall default to 50% FX of cross-border
- System shall display calculated FX amount in currency
- System shall support direct percentage editing
- System shall exclude non-FX cross-border from FX cost calculations

**Acceptance Criteria**:
- ✓ FX percentage applies only to cross-border rail payments
- ✓ Calculated FX amount displays with currency symbol
- ✓ Non-FX percentage shows remaining cross-border portion
- ✓ Slider allows 0-100% adjustment
- ✓ Direct percentage editing supported
- ✓ Default value is 50%

---

### REQ-007: FX Tier Distribution
**Topic**: FX Volume by Transaction Size  
**User Story**: As a sales analyst, I want to distribute FX volume across three transaction size tiers so that I can apply tiered FX margin pricing.

**Functional Requirements**:
- System shall provide three FX tiers: 0-100k, 100k-500k, >500k
- System shall allow percentage distribution across all three tiers
- System shall default to 40%, 35%, 25% distribution
- System shall ensure percentages sum to 100%
- System shall auto-adjust other tiers when one is changed
- System shall calculate monetary amounts for each tier
- System shall support direct percentage editing for all tiers

**Acceptance Criteria**:
- ✓ Three sliders provided for tier distribution
- ✓ Each tier shows percentage and calculated amount
- ✓ Adjusting one tier proportionally adjusts others
- ✓ Total always equals 100%
- ✓ All three tiers support direct editing
- ✓ Tier 3 slider is editable (not auto-calculated)

---

## 3. Fee Management & Configuration

### REQ-008: Current Provider Fee Configuration
**Topic**: Baseline Fee Structure  
**User Story**: As a sales analyst, I want to input the customer's current provider fees so that I can calculate savings against their existing costs.

**Functional Requirements**:
- System shall provide inputs for 6 current provider fees:
  - Local rail fee ($ per transaction)
  - Cross-border fee ($ per transaction)
  - FX margin tier 1 (%)
  - FX margin tier 2 (%)
  - FX margin tier 3 (%)
  - Card interchange (%)
- System shall validate all inputs as positive numbers
- System shall support decimal values
- System shall trigger recalculation on fee changes (800ms debounce)

**Acceptance Criteria**:
- ✓ All 6 fee inputs are clearly labeled
- ✓ Rail fees show currency symbol prefix
- ✓ Percentage fees show % symbol
- ✓ Default values pre-populated: $1.00, $3.50, 0.75%, 0.60%, 0.45%, 2.00%
- ✓ Changes trigger automatic recalculation
- ✓ Fees persist when saved

---

### REQ-009: Tungsten Fee Configuration
**Topic**: Tungsten Pay+ Pricing  
**User Story**: As a sales analyst, I want to configure Tungsten Pay+ fees so that I can model different pricing scenarios for customers.

**Functional Requirements**:
- System shall provide inputs for 6 Tungsten fees (same structure as current provider)
- System shall hide Tungsten fee settings by default
- System shall reveal settings via triple-click on logo
- System shall persist visibility state in localStorage
- System shall provide collapsible section for fee inputs
- System shall validate all inputs as positive numbers

**Acceptance Criteria**:
- ✓ Settings section hidden on initial load
- ✓ Triple-clicking logo toggles visibility
- ✓ Toast notification confirms unlock/hide action
- ✓ Visibility state persists across sessions
- ✓ Collapsible header with expand/collapse icon
- ✓ Default values: $0.50, $2.00, 0.50%, 0.35%, 0.20%, 1.50%

---

## 4. Calculation Engine

### REQ-010: Cost Calculation Logic
**Topic**: Provider Cost Computation  
**User Story**: As a system, I need to calculate costs for both current provider and Tungsten Pay+ so that I can determine savings.

**Functional Requirements**:
- System shall calculate costs for both providers using identical logic
- System shall compute local rail costs: count × fee per transaction
- System shall compute cross-border costs: count × fee per transaction
- System shall compute FX costs: tier volume × margin percentage
- System shall compute card costs: card volume × interchange percentage
- System shall sum all components for total annual cost
- System shall calculate cost per transaction: total cost ÷ total count
- System shall calculate effective rate: (total cost ÷ total volume) × 100

**Acceptance Criteria**:
- ✓ All cost components calculated correctly
- ✓ Rail costs use flat fees per transaction
- ✓ FX costs use percentage of tier volumes
- ✓ Card costs use percentage of card volume
- ✓ Total cost sums all components
- ✓ Metrics (cost per transaction, effective rate) calculated accurately
- ✓ Calculations complete within 50ms

---

### REQ-011: Savings Calculation
**Topic**: Cost Comparison & Savings  
**User Story**: As a sales analyst, I want to see savings calculations so that I can demonstrate value to customers.

**Functional Requirements**:
- System shall calculate savings: Current Cost - Tungsten Cost
- System shall calculate savings for each payment type:
  - Local rail savings
  - Cross-border rail savings
  - FX savings
  - Card savings
- System shall calculate total annual savings
- System shall calculate savings percentage: (savings ÷ current cost) × 100
- System shall handle negative savings (cost increase) gracefully

**Acceptance Criteria**:
- ✓ Savings calculated for all payment types
- ✓ Total savings equals sum of component savings
- ✓ Savings percentage calculated correctly
- ✓ Negative savings displayed appropriately
- ✓ All values rounded to appropriate precision
- ✓ Calculations update automatically on input changes

---

### REQ-012: Data Validation
**Topic**: Input Validation & Error Handling  
**User Story**: As a system, I need to validate all inputs so that calculations are accurate and errors are prevented.

**Functional Requirements**:
- System shall validate total payment value as positive number
- System shall validate total payment count as positive integer
- System shall validate FX percentage between 0-100
- System shall validate FX tier distribution sums to 100%
- System shall validate all fees as positive numbers
- System shall display error messages for invalid inputs
- System shall prevent calculation with invalid data

**Acceptance Criteria**:
- ✓ Negative values rejected with error message
- ✓ Non-numeric inputs rejected
- ✓ Percentage values validated within 0-100 range
- ✓ FX tier sum validated within 0.01% tolerance
- ✓ Error messages clear and actionable
- ✓ Invalid data prevents calculation execution

---

## 5. Results & Visualization

### REQ-013: Summary Cards Display
**Topic**: Key Metrics Overview  
**User Story**: As a sales analyst, I want to see key cost and savings metrics at a glance so that I can quickly assess the value proposition.

**Functional Requirements**:
- System shall display three summary cards:
  - Current Annual Cost (secondary card)
  - Tungsten Annual Cost (secondary card)
  - Annual Transaction Savings (primary card, emphasized)
- System shall format all values with currency symbols
- System shall use abbreviated format for large numbers (K, M, B)
- System shall emphasize savings card with larger size and bold styling
- System shall update cards in real-time as inputs change

**Acceptance Criteria**:
- ✓ Three cards displayed in Results tab
- ✓ Savings card visually emphasized (larger, bolder)
- ✓ All values formatted with appropriate currency
- ✓ Large numbers abbreviated (e.g., $1.5M)
- ✓ Cards update within 50ms of calculation completion
- ✓ Monochrome color scheme (Prussian Blue for savings)

---

### REQ-014: Savings Breakdown Chart
**Topic**: Savings by Payment Type Visualization  
**User Story**: As a sales analyst, I want to see a visual breakdown of where savings come from so that I can explain value drivers to customers.

**Functional Requirements**:
- System shall display horizontal bar chart showing savings by type
- System shall include four categories: Local Rail, Cross-Border, FX, Cards
- System shall use monochrome color scheme (Prussian Blue)
- System shall format values with currency symbols in tooltips
- System shall order bars by savings amount (largest first)
- System shall update chart when calculations change

**Acceptance Criteria**:
- ✓ Chart displays four payment type categories
- ✓ Bars sized proportionally to savings amounts
- ✓ Tooltips show formatted currency values
- ✓ Chart uses Prussian Blue color
- ✓ Chart updates smoothly with transitions
- ✓ Chart responsive to container size

---

### REQ-015: Cost Comparison Chart
**Topic**: Side-by-Side Cost Comparison  
**User Story**: As a sales analyst, I want to see a side-by-side comparison of costs so that I can visually demonstrate the difference between providers.

**Functional Requirements**:
- System shall display grouped bar chart comparing costs
- System shall show four payment types: Local Rail, Cross-Border, FX, Cards
- System shall display two bars per type: Current Provider (gray), Tungsten (Prussian Blue)
- System shall format values with currency in tooltips
- System shall use monochrome color palette
- System shall update chart when calculations change

**Acceptance Criteria**:
- ✓ Chart shows grouped bars for each payment type
- ✓ Current provider bars in gray
- ✓ Tungsten bars in Prussian Blue
- ✓ Legend clearly identifies providers
- ✓ Tooltips show formatted values
- ✓ Chart responsive and updates smoothly

---

### REQ-016: Cost Distribution Charts
**Topic**: Provider Cost Breakdown Visualization  
**User Story**: As a sales analyst, I want to see how costs are distributed across payment types for each provider so that I can identify cost concentration areas.

**Functional Requirements**:
- System shall display two doughnut charts side-by-side
- System shall show Current Provider distribution (4 segments)
- System shall show Tungsten distribution (5 segments including savings)
- System shall use monochrome color palette
- System shall display white segment for savings in Tungsten chart
- System shall show percentages and values in tooltips
- System shall add gray border to white savings segment for visibility

**Acceptance Criteria**:
- ✓ Two doughnut charts displayed side-by-side
- ✓ Current chart shows 4 cost segments
- ✓ Tungsten chart shows 4 cost segments + 1 savings segment
- ✓ Savings segment is white with gray border
- ✓ Tooltips show category, amount, and percentage
- ✓ Charts use consistent monochrome colors

---

## 6. Data Persistence & Management

### REQ-017: Auto-Save Functionality
**Topic**: Automatic Data Persistence  
**User Story**: As a sales analyst, I want my work to be automatically saved so that I don't lose progress if I close the browser.

**Functional Requirements**:
- System shall auto-save current calculation every 30 seconds
- System shall save to browser localStorage
- System shall restore last calculation on page load
- System shall display success toast when previous data is loaded
- System shall handle localStorage unavailability gracefully

**Acceptance Criteria**:
- ✓ Data saved automatically every 30 seconds
- ✓ All inputs and settings persisted
- ✓ Data restored on page reload
- ✓ Toast notification confirms data restoration
- ✓ System functions if localStorage unavailable
- ✓ No data loss during normal browser usage

---

### REQ-018: Manual Save/Load
**Topic**: Named Calculation Management  
**User Story**: As a sales analyst, I want to save and load named calculations so that I can manage multiple customer scenarios.

**Functional Requirements**:
- System shall provide Save button to create named calculations
- System shall prompt for calculation name
- System shall store up to 10 saved calculations
- System shall provide Load button to retrieve saved calculations
- System shall display list of saved calculations with dates
- System shall allow selection by number
- System shall overwrite existing calculation if same name used

**Acceptance Criteria**:
- ✓ Save button prompts for name
- ✓ Calculations saved with timestamp
- ✓ Load button shows list of saved calculations
- ✓ User can select calculation by number
- ✓ Maximum 10 calculations stored
- ✓ Oldest calculations removed when limit exceeded
- ✓ Success/error toasts displayed

---

### REQ-019: Storage Management
**Topic**: Data Storage Optimization  
**User Story**: As a system, I need to manage storage efficiently so that the application doesn't exceed browser limits.

**Functional Requirements**:
- System shall monitor localStorage usage
- System shall implement cleanup when quota exceeded
- System shall keep 5 most recent calculations when cleaning up
- System shall provide storage info (used/total/percentage)
- System shall handle QuotaExceededError gracefully
- System shall format storage sizes in human-readable format

**Acceptance Criteria**:
- ✓ Storage usage tracked
- ✓ Automatic cleanup when quota exceeded
- ✓ 5 most recent calculations preserved
- ✓ Storage info available (bytes, KB, MB)
- ✓ Quota errors handled without data loss
- ✓ User notified of storage issues

---

## 7. PDF Export & Reporting

### REQ-020: Single-Page PDF Export
**Topic**: Professional PDF Report Generation  
**User Story**: As a sales analyst, I want to export a professional PDF report so that I can share analysis results with customers and stakeholders.

**Functional Requirements**:
- System shall generate single-page A4 PDF report
- System shall include all key data and visualizations
- System shall use monochrome design (Prussian Blue and grays)
- System shall format all numbers with appropriate currency
- System shall include generation date
- System shall auto-download with descriptive filename
- System shall complete generation within 3 seconds

**Acceptance Criteria**:
- ✓ PDF generated as single A4 page
- ✓ All content fits on one page
- ✓ Professional monochrome design
- ✓ Currency symbols match selected currency
- ✓ Date stamp included
- ✓ Filename: Tungsten_Payments_Analysis_YYYY-MM-DD.pdf
- ✓ Generation completes quickly

---

### REQ-021: PDF Header Section
**Topic**: Report Header with Branding  
**User Story**: As a sales analyst, I want the PDF to include Tungsten branding so that it looks professional and official.

**Functional Requirements**:
- System shall display "Tungsten Pay+" title
- System shall display "Payments Optimisation Analysis" subtitle
- System shall include Pay+ logo (top right, if configured)
- System shall display generation date (top right)
- System shall include horizontal divider line
- System shall use configurable text from [`config.js`](config.js:1)

**Acceptance Criteria**:
- ✓ Title and subtitle displayed prominently
- ✓ Pay+ logo positioned top right (30mm × 12mm)
- ✓ Date formatted as "Mon DD, YYYY"
- ✓ Divider line separates header from content
- ✓ All text configurable via [`config.pdfText`](config.js:55)
- ✓ Logo optional (graceful fallback if not configured)

---

### REQ-022: PDF Placeholder Text Section
**Topic**: Customizable Introduction  
**User Story**: As a sales analyst, I want to include introductory text in the PDF so that I can provide context about the analysis.

**Functional Requirements**:
- System shall include placeholder text section after header
- System shall use configurable text from [`config.pdfText.placeholderText`](config.js:61)
- System shall wrap text to fit page width
- System shall use readable font size (9pt)
- System shall default to placeholder prompt if not configured

**Acceptance Criteria**:
- ✓ Placeholder section included in PDF
- ✓ Text configurable via config.js
- ✓ Text wraps appropriately
- ✓ Default placeholder clearly indicates customization needed
- ✓ Font size readable (9pt)
- ✓ Spacing appropriate

---

### REQ-023: PDF Key Facts Section
**Topic**: Two-Column Input Data Summary  
**User Story**: As a sales analyst, I want all input data summarized in the PDF so that customers can see the assumptions used.

**Functional Requirements**:
- System shall display "Key Facts" section title
- System shall use two-column layout for space efficiency
- System shall include 16 data points:
  - Left column: Currency, Total Payment Volume, Annual Payments, Rail %, Card %, Local Rail %, Cross-Border Rail %, FX % of Cross-Border
  - Right column: Current fees (6 items), Current Annual Cost, Tungsten Annual Cost
- System shall format all values appropriately (currency, percentages)
- System shall bold the two annual cost lines
- System shall use configurable labels from [`config.pdfText.keyFactsLabels`](config.js:65)

**Acceptance Criteria**:
- ✓ Section titled "Key Facts"
- ✓ Two-column layout implemented
- ✓ All 16 data points included
- ✓ Values formatted correctly
- ✓ Annual costs emphasized (bold, larger font)
- ✓ All labels configurable
- ✓ Tungsten cost in Prussian Blue

---

### REQ-024: PDF Savings Summary Section
**Topic**: Highlighted Savings Display  
**User Story**: As a sales analyst, I want the savings prominently displayed in the PDF so that the value proposition is immediately clear.

**Functional Requirements**:
- System shall display "Annual Transaction Savings" title
- System shall create large Prussian Blue box for savings
- System shall display "You Save Annually" label
- System shall display savings amount in large font (20pt)
- System shall display savings percentage with descriptive text
- System shall use configurable text from [`config.pdfText`](config.js:85)

**Acceptance Criteria**:
- ✓ Section titled per config
- ✓ Prussian Blue background box (full width, 22mm height)
- ✓ White text on blue background
- ✓ Savings amount prominent (20pt font)
- ✓ Percentage and description text included
- ✓ All text configurable
- ✓ Visually striking and clear

---

### REQ-025: PDF Savings Breakdown Table
**Topic**: Detailed Savings by Payment Type  
**User Story**: As a sales analyst, I want a detailed table showing savings by payment type so that I can explain where value comes from.

**Functional Requirements**:
- System shall display "Savings Breakdown" table
- System shall include 4 columns: Payment Type, Current Cost, % Savings, Value Driver
- System shall include 4 data rows: Local Rail, Cross-Border, FX, Cards
- System shall include total row (Prussian Blue background)
- System shall display value driver notes based on savings percentage
- System shall use 3-tier threshold system for value driver messages
- System shall use configurable text from [`config.pdfText`](config.js:90)

**Acceptance Criteria**:
- ✓ Table with 4 columns displayed
- ✓ Header row with gray background
- ✓ 4 data rows with alternating backgrounds
- ✓ Total row with Prussian Blue background, white text
- ✓ Value driver notes match savings percentage thresholds
- ✓ All labels and messages configurable
- ✓ Table fits within page margins

---

### REQ-026: PDF Value Driver System
**Topic**: Dynamic Value Driver Messaging  
**User Story**: As a sales analyst, I want value driver messages to automatically adjust based on savings levels so that the explanation matches the actual results.

**Functional Requirements**:
- System shall implement 3-tier threshold system per payment type
- System shall define thresholds: 0-20%, 20-50%, 50-100%
- System shall provide unique message for each tier and payment type
- System shall handle no-savings case (≤0%)
- System shall use configurable messages from [`config.valueDrivers`](config.js:9)
- System shall select appropriate message based on calculated savings percentage

**Acceptance Criteria**:
- ✓ Three threshold ranges defined per payment type
- ✓ Unique messages for each tier (12 total: 4 types × 3 tiers)
- ✓ No-savings message for each type
- ✓ Correct message selected based on percentage
- ✓ All messages configurable in config.valueDrivers
- ✓ Messages clear and professional

---

### REQ-027: PDF Footer Section
**Topic**: Report Footer with Branding  
**User Story**: As a sales analyst, I want the PDF footer to include Tungsten branding and disclaimers so that the report is complete and professional.

**Functional Requirements**:
- System shall include horizontal divider line
- System shall display footer title
- System shall display disclaimer text
- System shall include Tungsten logo (bottom center, if configured)
- System shall use configurable text from [`config.pdfText`](config.js:106)
- System shall position footer at bottom of page

**Acceptance Criteria**:
- ✓ Divider line above footer
- ✓ Footer title displayed (7pt font)
- ✓ Disclaimer text displayed (6pt font)
- ✓ Tungsten logo centered (40mm × 10mm)
- ✓ All text configurable
- ✓ Logo optional (graceful fallback)
- ✓ Footer positioned at page bottom

---

### REQ-028: PDF Logo Configuration
**Topic**: Base64 Logo Integration  
**User Story**: As a sales analyst, I want to include company logos in the PDF so that the report is branded appropriately.

**Functional Requirements**:
- System shall support two logos: Pay+ (header) and Tungsten (footer)
- System shall accept logos as base64 strings in [`config.pdfLogos`](config.js:48)
- System shall handle missing logos gracefully (no errors)
- System shall support PNG format
- System shall size logos appropriately
- System shall log warnings if logos fail to load

**Acceptance Criteria**:
- ✓ Two logo configuration fields in config.pdfLogos
- ✓ Base64 strings accepted
- ✓ Missing logos don't break PDF generation
- ✓ PNG format supported
- ✓ Pay+ logo: 30mm × 12mm (top right)
- ✓ Tungsten logo: 40mm × 10mm (bottom center)
- ✓ Console warnings for logo errors

---

## 8. User Interface & Experience

### REQ-029: Tab Navigation
**Topic**: Multi-Panel Interface  
**User Story**: As a sales analyst, I want to navigate between input and results views so that I can focus on the relevant information.

**Functional Requirements**:
- System shall provide two tabs: Inputs and Results
- System shall highlight active tab
- System shall show Inputs tab by default
- System shall preserve tab state during session
- System shall use smooth transitions between tabs
- System shall be keyboard accessible (ARIA attributes)

**Acceptance Criteria**:
- ✓ Two tabs displayed: Inputs, Results
- ✓ Active tab visually distinct (Prussian Blue underline)
- ✓ Inputs tab active on load
- ✓ Clicking tab switches view
- ✓ Smooth fade-in animation (200ms)
- ✓ Keyboard navigation supported
- ✓ ARIA attributes present

---

### REQ-030: Responsive Design
**Topic**: Multi-Device Support  
**User Story**: As a sales analyst, I want the calculator to work on different devices so that I can use it on desktop, tablet, or mobile.

**Functional Requirements**:
- System shall support desktop (1280px+), tablet (768px+), and mobile (320px+)
- System shall adjust layout for different screen sizes
- System shall use responsive grid systems
- System shall optimize touch interactions for mobile
- System shall maintain readability at all sizes
- System shall use appropriate font sizes per device

**Acceptance Criteria**:
- ✓ Desktop: 4-column summary cards, 3-column fee grid
- ✓ Tablet: 2-column summary cards, 2-column fee grid
- ✓ Mobile: 1-column layouts
- ✓ Touch targets minimum 44px on mobile
- ✓ Text readable without zooming
- ✓ Charts resize appropriately
- ✓ No horizontal scrolling

---

### REQ-031: Loading States
**Topic**: User Feedback During Processing  
**User Story**: As a sales analyst, I want to see loading indicators so that I know the system is processing my request.

**Functional Requirements**:
- System shall display loading overlay during calculations
- System shall show spinner animation
- System shall display descriptive text ("Calculating...", "Generating PDF...")
- System shall use semi-transparent backdrop
- System shall prevent interaction during loading
- System shall complete calculations within 50ms (loading rarely visible)

**Acceptance Criteria**:
- ✓ Loading overlay covers entire screen
- ✓ Spinner animation smooth and centered
- ✓ Loading text descriptive and clear
- ✓ Backdrop semi-transparent (50% black)
- ✓ User cannot interact with UI during loading
- ✓ Overlay removed immediately when complete

---

### REQ-032: Toast Notifications
**Topic**: User Feedback Messages  
**User Story**: As a sales analyst, I want to receive feedback messages so that I know when actions succeed or fail.

**Functional Requirements**:
- System shall display toast notifications for key actions
- System shall support three types: success, error, warning
- System shall auto-dismiss after 3 seconds
- System shall position toasts top-right
- System shall stack multiple toasts
- System shall use slide-in animation
- System shall include appropriate icons

**Acceptance Criteria**:
- ✓ Toasts appear top-right corner
- ✓ Three types with distinct visual styles
- ✓ Icons match message type (✓, ✕, ⚠)
- ✓ Auto-dismiss after 3 seconds
- ✓ Slide-in animation smooth
- ✓ Multiple toasts stack vertically
- ✓ Messages clear and concise

---

### REQ-033: Editable Percentages
**Topic**: Direct Percentage Input  
**User Story**: As a sales analyst, I want to click on percentages to edit them directly so that I can input precise values quickly.

**Functional Requirements**:
- System shall make percentage displays editable on click
- System shall select all text on focus
- System shall validate input as 0-100 range