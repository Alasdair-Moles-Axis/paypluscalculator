# Payments Optimisation Analysis - Redesign Implementation Plan

## Overview
Major redesign from "ROI Calculator" to "Payments Optimisation Analysis" focusing on transaction savings only.

## Key Changes Required

### 1. FX as Percentage of Cross-Border ✓ CRITICAL
**Current State**: FX has standalone volume input + percentage slider
**New State**: FX is ONLY a percentage of cross-border rail payments

**Implementation**:
- Remove: `<input id="fx-volume">` (lines 318-332 in index.html)
- Change: FX share slider description from "% of overall payments" to "% of cross-border rail payments that involve FX"
- Update: Calculator logic to derive FX volume from `crossBorderRailValue * fxPercent / 100`
- Update: All FX calculations to use derived volume

### 2. Remove ROI/Implementation Costs ✓ CRITICAL
**Remove from HTML**:
- ROI card (line 423-426)
- Payback Period card (line 427-430)
- Implementation Cost section from admin menu (lines 517-524)
- Annual Subscription Fee section from admin menu (lines 526-533)

**Remove from Calculator**:
- `implementationCost` field
- `annualSubscription` field
- `timeToROI` calculation
- `roi` calculation

**Keep Only**:
- Transaction cost comparison
- Annual savings calculation

### 3. Rebrand to "Payments Optimisation Analysis" ✓ CRITICAL
**Update Text**:
- Title: "Tungsten Pay+ Payments Optimisation Analysis" ✓ DONE
- Subtitle: "Analyze your annual transaction savings" ✓ DONE
- Results tab title: "Savings Analysis" (not "ROI Analysis")
- Summary card: "Annual Transaction Savings" (not "You Save Annually")

### 4. Fix Admin Menu Password ✓ CRITICAL
**Issue**: Password not being accepted
**Investigation**:
- Check config.js for correct password
- Verify password validation logic in app.js
- Test password input handling

### 5. Add Value Driver Explanations ✓ MEDIUM
**Implementation**: Modal popup system
**Locations**:
- Next to each fee section
- In results for each savings category
- In PDF export notes column

**Placeholder Messages**:
```javascript
const valueDrivers = {
  localRail: "[PLACEHOLDER] Optimized local payment routing reduces per-transaction costs",
  crossBorder: "[PLACEHOLDER] Efficient cross-border processing with competitive rates",
  fx: "[PLACEHOLDER] Competitive FX margins across all transaction tiers",
  cards: "[PLACEHOLDER] Better card interchange rates through volume agreements"
};
```

### 6. Add Chart Outline for White Space ✓ LOW
**Implementation**:
- Add border to "Your Savings" segment in Tungsten chart
- Use gray stroke with white fill
- Make savings segment visually distinct

### 7. Restructure PDF Export ✓ HIGH
**New Structure**:
1. Header: "Payments Optimisation Analysis"
2. Key Facts (4 boxes)
3. **Input Data Summary** (NEW)
   - Total payment volume
   - Number of payments
   - Currency
   - Payment method split (rail/card %)
   - Payment geography split (local/cross-border %)
   - FX percentage of cross-border
   - Current provider fees
   - Tungsten fees
4. Cost Savings Summary
5. Simplified Table

**Table Structure**:
| Payment Type | Current Annual Cost | % Savings | Notes |
|--------------|---------------------|-----------|-------|
| Local Rail   | $X                  | Y%        | [Value driver] |
| Cross-Border | $X                  | Y%        | [Value driver] |
| FX           | $X                  | Y%        | [Value driver] |
| Cards        | $X                  | Y%        | [Value driver] |
| **TOTAL**    | **$X**              | **Y%**    | |

**Notes Logic**:
```javascript
function getValueDriverNote(paymentType, savingsPercent) {
  if (savingsPercent <= 0) return "No savings in this category";
  
  const notes = {
    localRail: "[PLACEHOLDER] Optimized routing reduces costs",
    crossBorder: "[PLACEHOLDER] Efficient processing saves money",
    fx: "[PLACEHOLDER] Competitive margins lower FX costs",
    cards: "[PLACEHOLDER] Better interchange rates"
  };
  
  return notes[paymentType] || "";
}
```

### 8. Update Results Tab ✓ MEDIUM
**New Layout**:
1. Summary Cards (3 only):
   - Current Annual Cost
   - Tungsten Annual Cost
   - **Annual Transaction Savings** (emphasized, large)

2. Charts (keep existing):
   - Savings Breakdown
   - Cost Comparison
   - Cost Distribution

**Remove**:
- ROI card
- Payback Period card

## Implementation Order

### Phase 1: Critical Functionality (Do First)
1. ✓ Update branding text (title, subtitle)
2. Remove FX volume input, make it % of cross-border
3. Remove implementation cost & subscription from calculator
4. Remove ROI calculations
5. Fix admin password issue

### Phase 2: UI Updates
6. Update Results tab (remove ROI/payback cards)
7. Update summary cards text
8. Add chart outline for white space

### Phase 3: Enhancements
9. Add value driver modal system
10. Restructure PDF export
11. Add input data summary to PDF

## Files to Modify

1. **index.html**
   - Remove FX volume input
   - Update FX slider description
   - Remove ROI/payback cards
   - Remove implementation/subscription from admin
   - Update all text/labels

2. **calculator.js**
   - Remove implementationCost field
   - Remove annualSubscription field
   - Change FX volume to derived from cross-border
   - Remove ROI calculation
   - Remove timeToROI calculation
   - Keep only transaction savings

3. **app.js**
   - Remove FX volume input listener
   - Update FX slider to calculate from cross-border
   - Fix admin password validation
   - Remove implementation cost listeners
   - Update display functions

4. **charts.js**
   - Add border to white space segment in Tungsten chart

5. **pdf-export.js**
   - Complete restructure per new format
   - Add input data summary section
   - Simplify table structure
   - Add value driver notes logic

6. **config.js**
   - Verify admin password
   - Add value driver placeholder messages

## Testing Checklist

- [ ] FX volume correctly derived from cross-border amount
- [ ] FX slider updates cross-border-based calculation
- [ ] No ROI/payback displays anywhere
- [ ] No implementation cost inputs
- [ ] Admin password works correctly
- [ ] PDF exports with new structure
- [ ] All text updated to "Payments Optimisation Analysis"
- [ ] Charts display correctly with white space outline
- [ ] Value driver modals work (when implemented)
- [ ] Savings calculations are transaction-only (no subscription)

## Notes

- This is a MAJOR redesign affecting core functionality
- Test thoroughly after each phase
- Keep backup of current version
- FX calculation change is most critical - affects all downstream calculations