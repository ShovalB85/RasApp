# Serial Number New Approach - Implementation Plan

## New Structure

1. **Inventory Items with Serial Numbers**:
   - פריטי צל"ם מכילים רשימת מס"דים במלאי
   - מס"דים עם ערך = צל"ם
   - מס"דים ריקים = לל"צ (נשמר ב-quantity)

2. **Assignment Flow**:
   - שיוך פריט = בחירת מס"ד קיים מהמלאי
   - לא נוצר מס"ד חדש בזמן שיוך

3. **Display**:
   - כל מס"ד מוצג עם החייל המשויך
   - אם לא משויך - כפתור לשיוך
   - לל"צ מוצגים בשורה אחת עם כמות

## Database Changes

- `InventoryItem.serialNumbers: String[]` - רשימת מס"דים
- `quantity` - משמש ללל"צ (items without SN)

## UI Changes

1. **AddItemModal**: 
   - צל"ם toggle
   - רשימת מס"דים עם כפתור +
   - מס"ד ריק = לל"צ

2. **AddFromImageModal**:
   - תמיכה בצל"ם עם מס"דים מרובים
   - אפשרות להוסיף מס"ד נוסף מאותו פריט

3. **Inventory Display**:
   - כל מס"ד בשורה נפרדת
   - שם החייל ומס"ח מתחת
   - כפתור שיוך אם לא משויך
   - לל"צ בשורה אחת

4. **Assignment**:
   - בחירת מס"ד קיים
   - לא יצירת מס"ד חדש

