# Bugfix Requirements Document

## Introduction

The admin files and reports pages currently lack date range filtering capability, while the audit-logs page already has this feature. This inconsistency prevents administrators from filtering records by creation date, making it difficult to investigate specific time periods or audit recent activity. The fix adds date range filtering (from/to dates) to both the files and reports admin pages, matching the functionality that exists on the audit-logs page.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin user navigates to the files page THEN the system does NOT display date range filter inputs

1.2 WHEN an admin user navigates to the reports page THEN the system does NOT display date range filter inputs

1.3 WHEN an admin user attempts to filter files or reports by date range THEN the system is UNABLE TO apply date-based filters

1.4 WHEN an admin user compares the audit-logs page to the files/reports pages THEN the system shows INCONSISTENT filtering capabilities (audit-logs has date filters, files/reports do not)

### Expected Behavior (Correct)

2.1 WHEN an admin user navigates to the files page THEN the system SHALL display date range filter inputs labeled "จากวันที่" (from date) and "ถึงวันที่" (to date)

2.2 WHEN an admin user navigates to the reports page THEN the system SHALL display date range filter inputs labeled "จากวันที่" (from date) and "ถึงวันที่" (to date)

2.3 WHEN an admin user sets a date range on the files or reports page THEN the system SHALL filter results to show only records created within that date range

2.4 WHEN an admin user applies date filters to the files or reports page THEN the system SHALL send date_from and date_to parameters to the backend API

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin user applies date filters to the files page THEN the system SHALL CONTINUE TO apply all existing filters (text search, status, privacy) together with date range

3.2 WHEN an admin user applies date filters to the reports page THEN the system SHALL CONTINUE TO apply all existing filters (text search, risk level) together with date range

3.3 WHEN an admin user changes any filter including date filters on the files or reports page THEN the system SHALL CONTINUE TO reset pagination to page 1 automatically

3.4 WHEN an admin user uses the export CSV functionality on the files or reports page WITH date filters applied THEN the system SHALL CONTINUE TO export only the filtered results
