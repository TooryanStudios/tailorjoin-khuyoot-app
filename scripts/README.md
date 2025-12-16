# Database Migration Scripts

## User Fields Migration

### Purpose
Adds missing fields to existing user documents in Firestore to ensure all users have a complete, consistent data structure.

### Fields Added
- `profileImage`: Empty string (for profile pictures)
- `boardImage`: Empty string (for cover/banner images)
- `bio`: Empty string (for user biography)
- `loginId`: Phone number or email (login identifier)
- `createdByAdmin`: false (indicates if admin created the account)
- `requirePasswordChange`: false (forces password change on next login)
- `experience`: Empty string (for merchants only)
- `approvalStatus`: 'approved' (for merchants only, defaults to approved for existing)
- `location`: Region value or empty (for merchants only)
- `specialization`: Empty string (for merchants only)
- `ageGroup`: Empty string (for regular users only)

### How to Run

1. **Install dependencies** (if not already installed):
   ```powershell
   npm install
   ```

2. **Run the migration script**:
   ```powershell
   npx ts-node scripts/migrateUserFields.ts
   ```

3. **Review the output**:
   - The script will show progress for each user
   - At the end, it will display a summary with counts
   - Check for any errors reported

### What it Does
1. Connects to your Firestore database
2. Retrieves all users from the `users` collection
3. For each user:
   - Checks which fields are missing
   - Adds appropriate default values
   - Updates the document in Firestore
4. Provides detailed console output and summary

### Safety
- ✅ Only adds missing fields (doesn't overwrite existing data)
- ✅ Uses Firebase's `updateDoc` which merges data
- ✅ Shows detailed logs for each operation
- ✅ Reports any errors without stopping the entire process

### Example Output
```
🚀 Starting user migration...

📊 Found 19 users to process

👤 Processing: خياط الهدف (tailor)
  ➕ Adding profileImage
  ➕ Adding boardImage
  ➕ Adding bio
  ➕ Adding experience (merchant)
  ✅ Updated successfully

👤 Processing: المدير العام منير (admin)
  ⏭️ No updates needed (all fields present)

============================================================
📈 Migration Summary:
============================================================
✅ Updated:  15 users
⏭️ Skipped:  4 users (already complete)
❌ Errors:   0 users
📊 Total:    19 users
============================================================

✨ Migration completed!
```

### After Running
- Check your Firestore console to verify the updates
- Test the admin user management panel
- All users should now have consistent field structure
- Image uploads and other features should work correctly

### Troubleshooting
- **Firebase connection error**: Check your Firebase config in the script
- **Permission denied**: Ensure your Firebase project allows admin SDK access
- **TypeScript errors**: Run `npm install -D ts-node typescript` if needed
