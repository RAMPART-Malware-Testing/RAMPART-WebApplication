# Implementation Plan - Admin Filtering Enhancement

## Phase 1: Backend API Updates

### 1.1 Update Admin Files API Parameters

- [ ] Add `date_from` and `date_to` parameters to `AdminFilesListParams` interface in `/home/ubuntu/Desktop/RAMPART-WebApplication/src/hooks/queries/useAdminFiles.ts`
- [ ] Update API request body to include date parameters when provided
- [ ] Verify backend endpoint accepts these parameters correctly

**Requirements: 2.1, 4.1**

### 1.2 Update Admin Reports API Parameters

- [ ] Add `date_from` and `date_to` parameters to `AdminReportsListParams` interface in `/home/ubuntu/Desktop/RAMPART-WebApplication/src/hooks/queries/useAdminReports.ts`
- [ ] Update API request body to include date parameters when provided
- [ ] Verify backend endpoint accepts these parameters correctly

**Requirements: 2.2, 4.1**

## Phase 2: Frontend State Management

### 2.1 Files Page State

- [ ] Add `dateFrom` and `dateTo` state variables to `/home/ubuntu/Desktop/RAMPART-WebApplication/src/app/(pages)/admin/files/page.tsx`
- [ ] Initialize state with empty strings
- [ ] Add state setters for date inputs

**Requirements: 2.1**

### 2.2 Reports Page State

- [ ] Add `dateFrom` and `dateTo` state variables to `/home/ubuntu/Desktop/RAMPART-WebApplication/src/app/(pages)/admin/reports/page.tsx`
- [ ] Initialize state with empty strings
- [ ] Add state setters for date inputs

**Requirements: 2.2**

## Phase 3: UI Component Implementation

### 3.1 Files Page Date Range UI

- [ ] Add date range input section in filter sidebar (after privacy filter)
- [ ] Implement "จากวันที่" (from date) input with type="date"
- [ ] Implement "ถึงวันที่" (to date) input with type="date"
- [ ] Add max constraint: dateFrom cannot exceed dateTo
- [ ] Add min constraint: dateTo cannot precede dateFrom
- [ ] Apply consistent styling with existing filters

**Requirements: 2.1, 3.1**

### 3.2 Reports Page Date Range UI

- [ ] Add date range input section in filter sidebar (after risk level filter)
- [ ] Implement "จากวันที่" (from date) input with type="date"
- [ ] Implement "ถึงวันที่" (to date) input with type="date"
- [ ] Add max constraint: dateFrom cannot exceed dateTo
- [ ] Add min constraint: dateTo cannot precede dateFrom
- [ ] Apply consistent styling with existing filters

**Requirements: 2.2, 3.2**

## Phase 4: API Integration

### 4.1 Files Page API Integration

- [ ] Pass `date_from` to `useAdminFilesList` hook when dateFrom is set
- [ ] Pass `date_to` to `useAdminFilesList` hook when dateTo is set
- [ ] Verify API request includes date parameters
- [ ] Test filtered results match date range

**Requirements: 2.1, 4.1**

### 4.2 Reports Page API Integration

- [ ] Pass `date_from` to `useAdminReportsList` hook when dateFrom is set
- [ ] Pass `date_to` to `useAdminReportsList` hook when dateTo is set
- [ ] Verify API request includes date parameters
- [ ] Test filtered results match date range

**Requirements: 2.2, 4.1**

## Phase 5: Pagination Reset Behavior

### 5.1 Files Page Pagination Reset

- [ ] Add `dateFrom` and `dateTo` to existing useEffect dependencies
- [ ] Verify setPage(1) is called when date filters change
- [ ] Verify setSelected(new Set()) is called when date filters change

**Requirements: 4.1**

### 5.2 Reports Page Pagination Reset

- [ ] Add `dateFrom` and `dateTo` to existing useEffect dependencies
- [ ] Verify setPage(1) is called when date filters change
- [ ] Verify setSelected(new Set()) is called when date filters change

**Requirements: 4.1**

## Phase 6: Integration Testing

### 6.1 Date Filter Functionality

- [ ] Navigate to `/admin/files` and verify date inputs appear
- [ ] Set date range and verify API receives parameters
- [ ] Navigate to `/admin/reports` and verify date inputs appear
- [ ] Set date range and verify API receives parameters
- [ ] Test single-day date range filtering
- [ ] Test date range with only date_from set
- [ ] Test date range with only date_to set
- [ ] Test clearing date filters returns all results

**Requirements: 2.1, 2.2**

### 6.2 Filter Interaction Preservation

- [ ] Search + Date filter combination on files page
- [ ] Status filter + Date filter combination on files page
- [ ] Privacy filter + Date filter combination on files page
- [ ] Search + Date filter combination on reports page
- [ ] Risk level filter + Date filter combination on reports page
- [ ] Verify all filters apply together correctly (intersection)

**Requirements: 3.1, 3.2, 3.3**

### 6.3 Pagination Behavior

- [ ] Apply date filter on files page, verify page resets to 1
- [ ] Apply date filter on reports page, verify page resets to 1
- [ ] Change date filter, verify page resets to 1
- [ ] Verify pagination controls work with date filters applied

**Requirements: 4.1**

### 6.4 Export Functionality

- [ ] Apply date filter and export CSV on files page
- [ ] Apply date filter and export CSV on reports page
- [ ] Verify exported data matches filtered results

**Requirements: 3.4**

## Phase 7: Validation

### 7.1 Type Checking

- [ ] Run `pnpm exec tsc --noEmit`
- [ ] Fix any TypeScript errors

### 7.2 Build Validation

- [ ] Run `pnpm build`
- [ ] Verify no build errors
- [ ] Verify no warnings

### 7.3 Performance Check

- [ ] Verify UI remains responsive on 2GB RAM machine
- [ ] Verify no memory leaks
- [ ] Verify no busy polling or unbounded rendering

## Summary

**Total Tasks:**
- Backend API Updates: 2 tasks
- Frontend State Management: 2 tasks
- UI Component Implementation: 2 tasks
- API Integration: 2 tasks
- Pagination Reset Behavior: 2 tasks
- Integration Testing: 11 tasks
- Validation: 3 tasks

**Grand Total: 24 tasks**

All tasks are sequential and must be completed in order. Each task includes specific implementation details and references to the corresponding requirements from the design document.