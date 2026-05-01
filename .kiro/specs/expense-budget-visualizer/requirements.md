# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. It displays a running balance, a chronological transaction history, and a visual chart of spending broken down by category. The app runs entirely in the browser with no backend server; all data is persisted using the browser's Local Storage API. It must work as a standalone web page on modern desktop and mobile browsers.

---

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single financial record consisting of a description, amount, category, type (income or expense), and date.
- **Balance**: The net total calculated as the sum of all income transactions minus the sum of all expense transactions.
- **Category**: A user-selected label that classifies a transaction (e.g., Food, Transport, Entertainment, Health, Other).
- **Transaction_List**: The chronological display of all stored transactions.
- **Chart**: The visual representation of spending totals grouped by category.
- **Local_Storage**: The browser's Web Storage API used to persist transaction data client-side.
- **Form**: The UI control that accepts user input for adding a new transaction.
- **Filter**: A UI control that limits which transactions are shown in the Transaction_List.

---

## Requirements

### Requirement 1: Balance Overview

**User Story:** As a user, I want to see my current balance at a glance, so that I know whether I am within my budget.

#### Acceptance Criteria

1. THE App SHALL display the current Balance prominently at the top of the page.
2. WHEN a Transaction is added or deleted, THE App SHALL recalculate and update the displayed Balance immediately.
3. THE App SHALL display the total income and total expenses as separate summary values alongside the Balance.
4. WHILE the Transaction_List is empty, THE App SHALL display a Balance of zero.

---

### Requirement 2: Add Transaction

**User Story:** As a user, I want to add income and expense transactions, so that I can record my financial activity.

#### Acceptance Criteria

1. THE App SHALL provide a Form with the following fields: description (text), amount (positive number), category (selection from predefined list), type (income or expense), and date.
2. WHEN the user submits the Form with all required fields populated, THE App SHALL save the Transaction to Local_Storage and add it to the Transaction_List.
3. WHEN the user submits the Form with one or more required fields missing, THE App SHALL display an inline validation error identifying each missing field and SHALL NOT save the Transaction.
4. WHEN the user submits the Form with an amount that is not a positive number, THE App SHALL display a validation error and SHALL NOT save the Transaction.
5. WHEN a Transaction is successfully saved, THE App SHALL clear the Form fields and return the Form to its default state.

---

### Requirement 3: Transaction History

**User Story:** As a user, I want to view a history of all my transactions, so that I can review my past spending and income.

#### Acceptance Criteria

1. THE App SHALL display all stored Transactions in the Transaction_List, ordered from most recent to oldest by date.
2. THE App SHALL display the following fields for each Transaction in the Transaction_List: description, amount, category, type, and date.
3. THE App SHALL visually distinguish income transactions from expense transactions (e.g., using different colors or icons).
4. WHILE the Transaction_List is empty, THE App SHALL display a message indicating that no transactions have been recorded.

---

### Requirement 4: Delete Transaction

**User Story:** As a user, I want to delete a transaction, so that I can correct mistakes or remove outdated records.

#### Acceptance Criteria

1. THE App SHALL provide a delete control for each Transaction displayed in the Transaction_List.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from Local_Storage and from the Transaction_List.
3. WHEN a Transaction is deleted, THE App SHALL recalculate and update the Balance, total income, and total expenses immediately.

---

### Requirement 5: Spending Chart by Category

**User Story:** As a user, I want to see a visual breakdown of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL display a Chart that visualizes total expense amounts grouped by Category.
2. WHEN a Transaction is added or deleted, THE App SHALL update the Chart to reflect the current expense totals per Category.
3. THE App SHALL label each segment of the Chart with the corresponding Category name and its percentage of total expenses.
4. WHILE there are no expense Transactions, THE App SHALL display a placeholder message in the Chart area indicating that no spending data is available.
5. THE Chart SHALL include a legend that maps each Category to its visual representation.

---

### Requirement 6: Filter Transactions

**User Story:** As a user, I want to filter my transaction history by category or type, so that I can focus on specific spending areas.

#### Acceptance Criteria

1. THE App SHALL provide a Filter control that allows the user to select a Category or transaction type (income, expense, or all).
2. WHEN the user applies a Filter, THE App SHALL update the Transaction_List to show only Transactions matching the selected criteria.
3. WHEN the user clears or resets the Filter, THE App SHALL display all Transactions in the Transaction_List.
4. THE App SHALL display the count of Transactions currently shown in the Transaction_List.

---

### Requirement 7: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL write the updated Transaction dataset to Local_Storage.
2. WHEN a Transaction is deleted, THE App SHALL write the updated Transaction dataset to Local_Storage.
3. WHEN the App is loaded, THE App SHALL read all Transactions from Local_Storage and populate the Transaction_List, Balance, and Chart before accepting user input.
4. IF Local_Storage is unavailable or returns a parse error, THEN THE App SHALL display a warning message and operate with an empty Transaction dataset for the current session.

---

### Requirement 8: Clear All Data

**User Story:** As a user, I want to clear all my transaction data, so that I can start fresh without manually deleting each entry.

#### Acceptance Criteria

1. THE App SHALL provide a control to delete all stored Transactions at once.
2. WHEN the user activates the clear-all control, THE App SHALL display a confirmation prompt before proceeding.
3. WHEN the user confirms the clear-all action, THE App SHALL remove all Transactions from Local_Storage, reset the Transaction_List to empty, and reset the Balance, total income, and total expenses to zero.
4. WHEN the user cancels the clear-all confirmation, THE App SHALL take no action and leave all data unchanged.

---

### Requirement 9: Mobile-Friendly Layout

**User Story:** As a user on a mobile device, I want the app to be easy to use on a small screen, so that I can track expenses on the go.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that adapts to viewport widths from 320px to 2560px without horizontal scrolling.
2. THE App SHALL render all interactive controls (buttons, inputs, selects) at a minimum touch target size of 44×44 CSS pixels.
3. THE App SHALL be usable without a mouse, supporting keyboard navigation and touch input for all interactive elements.
4. THE App SHALL pass WCAG 2.1 Level AA color contrast requirements for all text and interactive elements.

---

### Requirement 10: Browser Compatibility

**User Story:** As a user, I want the app to work in any modern browser, so that I am not restricted to a specific platform.

#### Acceptance Criteria

1. THE App SHALL function correctly in the current stable release of Chrome, Firefox, Edge, and Safari without requiring browser plugins or extensions.
2. THE App SHALL use only standard HTML, CSS, and vanilla JavaScript APIs available in the browsers listed in criterion 1.
3. THE App SHALL be operable as a standalone local HTML file opened directly in a browser (i.e., via the `file://` protocol) without requiring a web server.
