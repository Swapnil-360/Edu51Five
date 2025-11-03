# 🔧 Quick Fix: Add Missing Columns to Notices Table

## Error You Saw
```
ERROR:  42703: column "category" of relation "notices" does not exist
```

## Solution: Run This SQL

Your notices table exists but is missing some columns. 

### Steps:

1. **Go to Supabase Console**
   - Open https://supabase.com
   - Select your Edu51Five project
   - Go to **SQL Editor**

2. **Run the Fix SQL**
   - Create new query
   - Copy-paste entire content from `FIX-NOTICES-TABLE.sql`
   - Click **Run** button

3. **Expected Output**
   ```
   Schema updated successfully!
   total_notices: X
   active_notices: Y
   ```

4. **Done!** ✅
   - Your notices table now has all required columns
   - Multi-device sync is ready to use

---

## What the SQL Does

✅ Adds `category` column
✅ Adds `priority` column  
✅ Adds `exam_type` column
✅ Adds `event_date` column
✅ Adds `updated_at` column (for tracking updates)
✅ Creates index for fast queries
✅ Creates trigger for auto-updating timestamps

---

## Next Steps

After running the SQL:

1. **Refresh your Edu51Five app** in browser
2. **Go to Admin Panel** → Notice Management
3. **Add a test notice** to verify it works
4. **Check notification bell** icon - new notice should appear instantly!

---

**That's it!** Your notices system is now ready for production use across all devices. 🚀
