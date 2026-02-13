# Header & Scroll Alignment Playbook (MontHeader / Account-style pages)

## Purpose
This guide documents exactly how the Transaction History header/scroll issue was fixed and how to diagnose/fix the same class of bug in future pages.

---

## 1) What the bug looked like

Symptoms observed:
1. The page scrollbar started in the wrong vertical position (under or behind the fixed header).
2. A large blank gap appeared between the fixed header and page content.
3. Fixing one symptom often reintroduced the other (hidden scrollbar vs. extra gap).

Why this happens:
- The app has multiple top-level layouts with different header systems.
- If route placement and page-level header offset logic are mixed incorrectly, fixed headers and scroll containers conflict.

---

## 2) Root cause found

The issue was not only inside the page spacing values. It was a **layout hierarchy mismatch**.

### Key finding
- Account page lives under ClientLayout and has specific “hide chrome + self-managed MontHeader” behavior.
- Transaction History was placed differently, so it did not inherit the same shell behavior as Account.
- This caused different scroll/offset behavior even when spacing values looked similar.

---

## 3) Final fix applied (exactly what changed)

### A) Route was moved to the same layout branch as Account
- Transaction History route was placed under the ClientLayout route group (same group used by Account).

Changed in:
- App route registration: App.tsx

### B) ClientLayout was updated to treat Transaction History like Account
- Added `/transaction-history` to the same conditions used for Account in:
  - hideHeader
  - hideChrome

This ensures Transaction History does not render conflicting top header/footer chrome from ClientLayout and can safely use MontHeader with the same behavior pattern.

### C) Transaction History retained Account-style header offset structure
The page uses:
1. Fixed MontHeader
2. Spacer element with dynamic measured height
3. Scroll container with scrollPaddingTop

Also added accessibility for the icon-only back button.

---

## 4) Files touched

1. Route placement:
- App.tsx

2. Shared shell behavior:
- src/client/layout/ClientLayout.tsx

3. Page-level header/scroll structure:
- src/pages/TransactionHistory.tsx

---

## 5) Correct structural pattern (must be copied as-is)

For pages that render MontHeader directly and need Account-like behavior:

1. Top page wrapper:
- full viewport height
- overflow hidden
- flex column

2. Render MontHeader (fixed).

3. Render spacer right after header:
- aria-hidden
- pointer-events-none
- height = measured header height

4. Render scroll container:
- flex-1
- overflow-y-auto
- scrollPaddingTop = measured header height

5. Put page content inside scroll container.

Important: do not replace this with random margin/padding hacks unless you fully verify layout branch behavior.

---

## 6) Measurement logic used

A measured header height is used, not hardcoded static values:
- header element id: `khuyoot-mont-header`
- fallback default used initially
- measure via getBoundingClientRect in a layout effect
- update on resize

Why:
- Header height can vary by breakpoint/device.
- Dynamic measurement prevents off-by-N pixels issues.

---

## 7) Why previous attempts oscillated (hidden scrollbar vs. large gap)

These combinations can conflict if layout branch is wrong:
- Spacer only
- scrollPaddingTop only
- spacer + scrollPaddingTop
- paddingTop + negative marginTop hacks

If the route is mounted in a different shell, visual behavior changes. This is why spacing tweaks alone kept flipping between two broken states.

---

## 8) Diagnostic workflow for future pages

Use this exact sequence:

### Step 1: Verify route branch first (before CSS tuning)
- Confirm the page route is under the intended layout branch (same branch as the page it should match).
- If target behavior is “same as Account,” route must share Account’s shell behavior.

### Step 2: Verify shell header/footer behavior
- If page uses MontHeader internally, parent layout should not render competing header/chrome for that route.
- Update hideHeader/hideChrome conditions in shared layout if required.

### Step 3: Verify page-level structure order
Order must be:
1) MontHeader
2) spacer
3) scroll container
4) content

### Step 4: Verify dynamic header measurement
- Ensure id lookup succeeds.
- Ensure measured height is non-zero.
- Ensure resize listener updates height.

### Step 5: Validate both states
- authenticated view
- unauthenticated/empty/error view

Both branches must use the same header offset pattern.

### Step 6: Accessibility check
- icon-only buttons need aria-label/title.

---

## 9) Quick anti-pattern list (avoid)

1. Putting route in a different layout branch while expecting identical behavior.
2. Applying one-off `paddingTop`/`marginTop` patches without resolving route/layout mismatch.
3. Inconsistent structure between auth and guest render branches.
4. Using index-based hacks instead of dynamic header measurement.
5. Forgetting to disable/align parent layout chrome for MontHeader pages.

---

## 10) Regression checklist

Before closing any similar issue, verify:

1. Scrollbar starts below fixed header and is not hidden.
2. No artificial empty gap appears above first content block.
3. Header and content spacing matches reference page (Account).
4. Mobile and desktop both behave correctly.
5. Guest and logged-in states both align correctly.
6. Back button and icon-only controls have accessible labels.

---

## 11) Mapping reference (what to compare against)

When debugging a new page, compare against Account behavior in this order:
1. Route branch placement
2. Parent layout hideHeader/hideChrome behavior
3. Page DOM order (header/spacer/scroll/content)
4. Dynamic header height logic

If all four match, spacing issues are usually resolved without extra hacks.

---

## 12) Implementation note for team

For any new “account-like” page (wallet, transactions, history, profile subpages):
- Start from the same route/layout branch and structural template as Account.
- Do not invent a separate header offset strategy unless there is a hard requirement.

This prevents repeated regressions and reduces time spent on visual spacing bugs.