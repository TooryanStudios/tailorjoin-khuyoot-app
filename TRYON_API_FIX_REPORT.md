# Try-On API Payload Issue - Diagnostic Report & Fix

**Date**: December 24, 2025  
**Issue**: TryFabricPanel sending incomplete/incorrect payload to Try-On API  
**Status**: ✅ **FIXED**

---

## Problem Analysis

### Issue #1: Incomplete Options Object
**Location**: `src/designer/components/TryFabricPanel.tsx:720-735`

**Problem**: The payload construction used spread operator `...optionsForPayload` which could send partial or empty options object if state was not fully initialized.

```typescript
// ❌ BEFORE (vulnerable to missing fields)
options: {
  ...optionsForPayload,
  fabricScale: Math.max(0.5, Math.min(3, Number((optionsForPayload as any).fabricScale ?? 1))),
}
```

**Impact**: Server expects all option fields for AI prompt generation. Missing fields could cause:
- Incomplete AI prompts
- Unexpected defaults
- API errors if validation was stricter

---

### Issue #2: Server Missing Validation
**Location**: `server/tryon/validation.ts:42-48`

**Problem**: Server validation only checked `fabricScale` range but didn't validate:
- `options` object exists
- Required fields (neckStyle, sleeveStyle, embroideryStyle, colorPreservation) are present
- Field values are within allowed enums

**Impact**: Invalid payloads could pass validation and cause downstream errors.

---

### Issue #3: Type Definition Inconsistency
**Location**: `src/types/tryon.ts:9-18`

**Problem**: TypeScript type declares `options: TryOnOptions` as **required**, but server code uses **optional chaining** (`req.options?.fabricScale`), creating ambiguity.

**Impact**: Developers unclear whether `options` is truly required or optional.

---

## Root Cause

The server **requires** these fields to build the AI generation prompt (see `buildPrompt` in `server/tryon/tryonHandler.ts:95-115`):

```typescript
const scale = req.options?.fabricScale ?? 1;        // Required for pattern scaling
const neck = req.options?.neckStyle || 'keep';      // Required for neckline handling
const sleeve = req.options?.sleeveStyle || 'keep';  // Required for sleeve handling
const emb = req.options?.embroideryStyle || 'keep'; // Required for embroidery handling
```

If these fields are missing or undefined, the prompt gets incorrect defaults.

---

## Solution Applied

### Fix #1: Client-Side Payload Construction ✅
**File**: `src/designer/components/TryFabricPanel.tsx`

```typescript
// ✅ AFTER (explicit defaults for all required fields)
options: {
  neckStyle: optionsForPayload?.neckStyle || 'keep',
  embroideryStyle: optionsForPayload?.embroideryStyle || 'keep',
  sleeveStyle: optionsForPayload?.sleeveStyle || 'keep',
  fabricScale: Math.max(0.5, Math.min(3, Number(optionsForPayload?.fabricScale ?? 1))),
  colorPreservation: optionsForPayload?.colorPreservation || 'high',
}
```

**Changes**:
- Removed spread operator (`...optionsForPayload`)
- Added explicit default for each field
- Ensured all fields match server expectations
- Added defensive optional chaining (`?.`) to prevent crashes

---

### Fix #2: Server-Side Validation ✅
**File**: `server/tryon/validation.ts`

Added comprehensive validation for `options` object:

```typescript
// Validate that options object exists and has required fields
if (!req.options || typeof req.options !== 'object') {
  return { ok: false, status: 400, message: 'options object is required' };
}

// Validate option fields have valid values (server uses these in prompt)
const validStyles = ['keep', 'modify', 'remove'];
if (req.options.neckStyle && typeof req.options.neckStyle === 'string' && !validStyles.includes(req.options.neckStyle)) {
  return { ok: false, status: 400, message: 'Invalid neckStyle value' };
}
// ... similar validation for sleeveStyle, embroideryStyle, colorPreservation
```

**Changes**:
- Validates `options` object exists and is an object
- Validates enum values for neckStyle, sleeveStyle, embroideryStyle
- Validates colorPreservation is one of: 'high', 'medium', 'low'
- Returns clear error messages for invalid values

---

## Expected vs Actual Payload

### ✅ Correct Payload (After Fix)
```json
{
  "garmentTemplateId": "template-001",
  "garmentTemplateImageUrl": "https://...",
  "fabricImageUrl": "https://...",
  "options": {
    "neckStyle": "keep",
    "embroideryStyle": "keep",
    "sleeveStyle": "keep",
    "fabricScale": 1,
    "colorPreservation": "high"
  }
}
```

### ❌ Potential Bad Payload (Before Fix)
```json
{
  "garmentTemplateId": "template-001",
  "garmentTemplateImageUrl": "https://...",
  "fabricImageUrl": "https://...",
  "options": {
    "fabricScale": 1
    // Missing: neckStyle, sleeveStyle, embroideryStyle, colorPreservation
  }
}
```

---

## Validation Rules (Server)

| Field | Type | Required | Valid Values | Default |
|-------|------|----------|--------------|---------|
| `options` | object | ✅ Yes | N/A | N/A |
| `options.neckStyle` | string | ⚠️ Optional | 'keep', 'modify', 'remove' | 'keep' |
| `options.sleeveStyle` | string | ⚠️ Optional | 'keep', 'modify', 'remove' | 'keep' |
| `options.embroideryStyle` | string | ⚠️ Optional | 'keep', 'modify', 'remove' | 'keep' |
| `options.fabricScale` | number | ⚠️ Optional | 0.5 - 3.0 | 1 |
| `options.colorPreservation` | string | ⚠️ Optional | 'high', 'medium', 'low' | 'high' |

**Note**: While individual fields are optional (server provides defaults), the `options` object itself is now **required**.

---

## Testing Recommendations

### 1. **Manual Testing**
- [ ] Test Try-On with default options (all 'keep', scale 1)
- [ ] Test Try-On with custom options (modify neckStyle, sleeveStyle)
- [ ] Test Try-On with extreme fabricScale values (0.5, 3.0)
- [ ] Test both external mode (`useExternalCards=true`) and inline mode

### 2. **Edge Cases**
- [ ] Test with missing `initialOptions` prop
- [ ] Test with partially populated `initialOptions`
- [ ] Test with invalid option values (should be caught by validation)

### 3. **Error Scenarios**
- [ ] Send payload with missing `options` object → should return 400 error
- [ ] Send payload with invalid `neckStyle` value → should return 400 error
- [ ] Send payload with out-of-range `fabricScale` → should return 400 error

---

## Files Changed

1. **`src/designer/components/TryFabricPanel.tsx`**
   - Lines ~720-735: Fixed payload construction with explicit defaults
   
2. **`server/tryon/validation.ts`**
   - Lines ~42-70: Added comprehensive `options` object validation

---

## Impact Assessment

### Before Fix
- ❌ Potential for incomplete payloads
- ❌ No server-side validation of option values
- ❌ Risk of API errors or incorrect AI generation

### After Fix
- ✅ All payloads include complete `options` with valid defaults
- ✅ Server validates all option fields and values
- ✅ Clear error messages for invalid requests
- ✅ Type safety maintained

---

## Next Steps

1. **Deploy & Monitor**
   - Deploy changes to dev/staging
   - Monitor server logs for validation errors
   - Check AI generation quality with various options

2. **Consider Future Improvements**
   - Add E2E tests for Try-On API
   - Add TypeScript strict mode to catch payload issues at compile time
   - Consider adding runtime schema validation (e.g., Zod) for extra safety

---

## Related Files

- `src/types/tryon.ts` - TypeScript type definitions
- `server/tryon/tryonHandler.ts` - Main API handler (uses options in prompt)
- `server/tryon/templates.ts` - Template definitions
- `src/services/tryonService.ts` - Client-side API wrapper

---

**Status**: ✅ **Fixed and documented**  
**Reviewer**: Ready for testing
