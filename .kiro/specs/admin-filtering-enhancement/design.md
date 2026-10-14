# Admin Filtering Enhancement Design

## Overview

This design documents the addition of date range filtering to the admin reporting pages (files and reports). The audit-logs page already has date filtering implemented, and we will replicate this pattern across all admin pages to provide consistent user experience. The enhancement adds `date_from` and `date_to` state management, API parameter passing, and UI components for date selection. It also ensures pagination resets when date filters change, maintaining consistency with existing filter behavior.

## Glossary

- **date_from**: Start date for filtering records (inclusive)
- **date_to**: End date for filtering records (inclusive)
- **filter state**: React state variables that track current filter values
- **API parameters**: Query parameters sent to backend API endpoints
- **pagination reset**: Behavior that returns user to page 1 when filters change
- **admin pages**: `/admin/files`, `/admin/reports`, `/admin/audit-logs`

## Bug Details

### Bug Condition

Currently, the `/admin/files` and `/admin/reports` pages lack date range filtering capability. Users cannot filter files or reports by creation date, making it difficult to investigate recent issues or audit specific time periods.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PageType (files or reports)
  OUTPUT: boolean
  
  RETURN input.page IN ['/admin/files', '/admin/reports']
         AND NOT hasDateRangeFilter(input.page)
END FUNCTION
```

### Examples

- **Missing Date Filter on Files Page**: Admin cannot filter files created between 2024-01-01 and 2024-02-01 to investigate a specific incident
- **Missing Date Filter on Reports Page**: Admin cannot view reports generated in the last 7 days for daily monitoring
- **Inconsistent UX**: Audit-logs page has date filters but files/reports pages don't, creating inconsistent admin experience

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing search/filter functionality (search query, status, privacy for files; search, risk level for reports) must continue to work exactly as before
- Pagination behavior must remain unchanged except for the new reset behavior on date filter changes
- All existing API endpoints must continue to accept the same parameters
- UI layout and styling must remain consistent with current patterns

**Scope:**
Date filtering is an additive feature - no existing behavior should be modified or removed. This includes:
- Text search functionality
- Status/risk level filtering
- Bulk actions and selection
- Export functionality
- Pagination controls

## Hypothesized Root Cause

The date filtering feature was only implemented for audit-logs page during initial development, possibly due to:
1. Audit-logs being the first admin page with filtering needs
2. Date filtering for files/reports was not considered during initial implementation
3. Feature request came after audit-logs implementation was complete

## Correctness Properties

Property 1: Date Range Filter Functionality

_For any_ admin user accessing the files or reports page, when they set date_from and/or date_to values, the system SHALL display only records created within that date range, and the API shall send the appropriate date parameters to the backend.

**Validates: Requirements 2.1, 2.2**

Property 2: Filter Interaction Preservation

_For any_ combination of filters (search, status/risk level, date range), the system SHALL apply all filters together correctly, returning records that match ALL active filters simultaneously.

**Validates: Requirements 3.1, 3.2, 3.3**

Property 3: Pagination Reset Behavior

_For any_ change to date_from or date_to values, the system SHALL automatically reset the current page to 1, ensuring users see the first page of filtered results.

**Validates: Requirements 4.1**

## Fix Implementation

### Changes Required

**File 1: `/home/ubuntu/Desktop/RAMPART-WebApplication/src/app/(pages)/admin/files/page.tsx`**

**Changes:**
1. Add `dateFrom` and `dateTo` state variables (lines ~54-55)
2. Add `date_from` and `date_to` to API params in `useAdminFilesList` call (lines ~65-68)
3. Add pagination reset `useEffect` for date filters (lines ~72-74)
4. Add date range UI component in filter sidebar (lines ~132-160)

**Specific Implementation:**

```typescript
// 1. State variables (after privacyFilter)
const [dateFrom, setDateFrom] = useState('')
const [dateTo, setDateTo] = useState('')

// 2. API parameters (in useAdminFilesList call)
const { data: listResult, isLoading } = useAdminFilesList({
  page,
  limit: 20,
  q: search || undefined,
  status: statusFilter !== 'all' ? statusFilter : undefined,
  privacy: privacyFilter !== 'all' ? privacyFilter === 'private' : undefined,
  date_from: dateFrom || undefined,
  date_to: dateTo || undefined,
})

// 3. Pagination reset useEffect (add to existing useEffect dependencies)
useEffect(() => {
  setPage(1)
  setSelected(new Set())
}, [search, statusFilter, privacyFilter, dateFrom, dateTo])

// 4. UI component (in filter sidebar, after privacy filter)
<div className="grid grid-cols-1 gap-3">
  <div>
    <label className="block text-sm text-blue-200/60 mb-2">จากวันที่</label>
    <input
      type="date"
      value={dateFrom}
      max={dateTo || undefined}
      onChange={(e) => setDateFrom(e.target.value)}
      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition [color-scheme:dark]"
    />
  </div>
  <div>
    <label className="block text-sm text-blue-200/60 mb-2">ถึงวันที่</label>
    <input
      type="date"
      value={dateTo}
      min={dateFrom || undefined}
      onChange={(e) => setDateTo(e.target.value)}
      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition [color-scheme:dark]"
    />
  </div>
</div>
```

**File 2: `/home/ubuntu/Desktop/RAMPART-WebApplication/src/app/(pages)/admin/reports/page.tsx`**

**Changes:**
1. Add `dateFrom` and `dateTo` state variables
2. Add `date_from` and `date_to` to API params in `useAdminReportsList` call
3. Add pagination reset `useEffect` for date filters
4. Add date range UI component in filter sidebar

**Specific Implementation:**

```typescript
// 1. State variables (after riskFilter)
const [dateFrom, setDateFrom] = useState('')
const [dateTo, setDateTo] = useState('')

// 2. API parameters (in useAdminReportsList call)
const { data: listResult, isLoading } = useAdminReportsList({
  page,
  limit: 20,
  q: search || undefined,
  risk_level: riskFilter !== 'all' ? riskFilter : undefined,
  date_from: dateFrom || undefined,
  date_to: dateTo || undefined,
})

// 3. Pagination reset useEffect (add to existing useEffect dependencies)
useEffect(() => {
  setPage(1)
  setSelected(new Set())
}, [search, riskFilter, dateFrom, dateTo])

// 4. UI component (in filter sidebar, after risk level filter)
<div className="grid grid-cols-1 gap-3">
  <div>
    <label className="block text-sm text-blue-200/60 mb-2">จากวันที่</label>
    <input
      type="date"
      value={dateFrom}
      max={dateTo || undefined}
      onChange={(e) => setDateFrom(e.target.value)}
      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition [color-scheme:dark]"
    />
  </div>
  <div>
    <label className="block text-sm text-blue-200/60 mb-2">ถึงวันที่</label>
    <input
      type="date"
      value={dateTo}
      min={dateFrom || undefined}
      onChange={(e) => setDateTo(e.target.value)}
      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition [color-scheme:dark]"
    />
  </div>
</div>
```

**File 3: `/home/ubuntu/Desktop/RAMPART-WebApplication/src/hooks/queries/useAdminFiles.ts`**

**Changes:**
1. Add `date_from` and `date_to` to `AdminFilesListParams` interface
2. Update API call to include date parameters

**Specific Implementation:**

```typescript
export interface AdminFilesListParams {
  page: number
  limit: number
  q?: string
  status?: string
  privacy?: boolean
  date_from?: string
  date_to?: string
}

// In useAdminFilesList, add to body object:
if (params.date_from) body.date_from = params.date_from
if (params.date_to) body.date_to = params.date_to
```

**File 4: `/home/ubuntu/Desktop/RAMPART-WebApplication/src/hooks/queries/useAdminReports.ts`**

**Changes:**
1. Add `date_from` and `date_to` to `AdminReportsListParams` interface
2. Update API call to include date parameters

**Specific Implementation:**

```typescript
export interface AdminReportsListParams {
  page: number
  limit: number
  q?: string
  risk_level?: string
  date_from?: string
  date_to?: string
}

// In useAdminReportsList, add to body object:
if (params.date_from) body.date_from = params.date_from
if (params.date_to) body.date_to = params.date_to
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach:
1. **Exploratory Checking**: Verify the new date filter UI appears and functions correctly on files/reports pages
2. **Fix Checking**: Verify date filtering works correctly with backend API
3. **Preservation Checking**: Verify existing functionality is not affected by date filter additions

### Exploratory Bug Condition Checking

**Goal**: Confirm date filter UI appears on files and reports pages, and date parameters are sent to API.

**Test Plan**: 
1. Navigate to `/admin/files` page
2. Verify date range input fields appear in filter sidebar (from/to dates)
3. Set a date range and verify API request includes `date_from` and `date_to` parameters
4. Repeat for `/admin/reports` page

**Test Cases**:
1. **Files Page Date UI**: Verify date_from and date_to inputs appear in filter sidebar (will fail if not implemented)
2. **Reports Page Date UI**: Verify date_from and date_to inputs appear in filter sidebar (will fail if not implemented)
3. **API Parameter Sending**: Verify API request includes date parameters when set (will fail if backend integration missing)

**Expected Counterexamples**:
- Date filter UI not visible on files/reports pages
- Date parameters not sent to API endpoint
- Date inputs not functioning (read-only, wrong date format)

### Fix Checking

**Goal**: Verify that for all date range inputs, the filtered results match the expected records.

**Pseudocode**:
```
FOR ALL date_range WHERE date_range IS valid DO
  results := useAdminFilesList({ date_from: date_range.start, date_to: date_range.end })
  ASSERT all(results).created_at >= date_range.start
  ASSERT all(results).created_at <= date_range.end
END FOR
```

**Test Cases**:
1. **Single Day Filter**: Filter by single day (e.g., 2024-01-15 to 2024-01-15) - should show only records from that day
2. **Date Range Filter**: Filter by range (e.g., 2024-01-01 to 2024-01-31) - should show records only within range
3. **Partial Date Filter**: Filter with only date_from or only date_to - should filter correctly with one boundary
4. **No Date Filter**: Clear all date filters - should show all records (backward compatibility)

### Preservation Checking

**Goal**: Verify that date filtering does not affect existing filters and behaviors.

**Pseudocode**:
```
FOR ALL non-date_input WHERE NOT isBugCondition(input) DO
  ASSERT searchInput(input) continues to work
  ASSERT statusFilter(input) continues to work (files only)
  ASSERT riskFilter(input) continues to work (reports only)
  ASSERT bulkActions(input) continues to work
  ASSERT export(input) continues to work
END FOR
```

**Test Cases**:
1. **Search + Date Combination**: Search by text AND set date range - results should match both criteria
2. **Status + Date Combination** (files): Status filter AND date range - results should match both
3. **Risk Level + Date Combination** (reports): Risk filter AND date range - results should match both
4. **Export Functionality**: Export CSV with date filters applied - should export filtered results
5. **Pagination Preservation**: Pagination controls work correctly with date filters applied

### Unit Tests

- **Date State Management**: Test dateFrom/dateTo state updates correctly
- **Date Validation**: Test date inputs enforce max/min constraints (date_from <= date_to)
- **API Parameter Construction**: Test that API params object includes date parameters when set
- **Pagination Reset**: Test setPage(1) is called when date filters change

### Property-Based Tests

- **Random Date Ranges**: Generate random valid date ranges and verify filtering correctness
- **Filter Combinations**: Generate random combinations of all filters and verify correct intersection
- **Boundary Conditions**: Test edge cases like single-day ranges, empty ranges, future dates

### Integration Tests

- **Full Admin Files Flow**: Complete workflow with search, status, and date filters
- **Full Admin Reports Flow**: Complete workflow with search, risk level, and date filters
- **Date Range Edge Cases**: Test very old dates, future dates, single-day ranges
- **Backend Integration**: Verify API endpoint receives correct date parameters and returns filtered results
