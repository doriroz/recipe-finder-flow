

# דשבורד אנליטיקס למנהל - עם אפשרות השבתה מהירה

## סקירה
בניית דשבורד אנליטיקס למנהל מערכת בלבד, עם כפתור "השבת דשבורד" בתוך הדף עצמו. לחיצה על הכפתור תציג דיאלוג אישור, ואם המנהל מאשר - הדשבורד יוסתר מכל המשתמשים (כולל מנהלים) עד שיופעל מחדש דרך הדאטאבייס.

## איך ההשבתה עובדת
- טבלת `app_settings` בדאטאבייס עם שורה `analytics_dashboard_enabled = true/false`
- הדשבורד בודק את ההגדרה בעת טעינה - אם `false`, מציג הודעה "הדשבורד מושבת"
- כפתור "השבת דשבורד" עם AlertDialog לאישור כפול
- להפעלה מחדש: הרצת UPDATE פשוט ב-SQL Editor

## שלבים

### 1. מיגרציית דאטאבייס
- Enum `app_role` עם ערכים `admin`, `user`
- טבלת `user_roles` (user_id, role) עם RLS
- פונקציית `has_role()` - security definer
- טבלת `app_settings` (key TEXT PRIMARY KEY, value JSONB) עם שורת ברירת מחדל `analytics_dashboard_enabled = true`
- RLS: כולם קוראים, רק admin כותב

### 2. Edge Function - `get-analytics`
- אימות JWT ובדיקת תפקיד admin
- בדיקה ש-`analytics_dashboard_enabled = true` ב-`app_settings`
- אם מושבת: מחזיר `{ disabled: true }`
- אם פעיל: מחזיר סטטיסטיקות מצורפות (סיכום, יומי, לפי אירוע)

### 3. Edge Function - `toggle-analytics-dashboard`
- אימות admin
- מקבלת `{ enabled: boolean }`
- מעדכנת את `app_settings`

### 4. Hook - `useIsAdmin`
- בודק ב-`user_roles` אם למשתמש הנוכחי יש role=admin
- משמש להגנה על הנתיב ולהצגת לינק ב-UserMenu

### 5. דף דשבורד - `/admin/analytics`
- בדיקת הרשאות admin (אם לא admin -> הפניה לדף הבית)
- בדיקה אם הדשבורד מושבת -> הודעה "הדשבורד מושבת כרגע"
- כרטיסי סיכום: סה"כ אירועים, הורדות PDF, שיעור המרה
- גרף עמודות (Recharts) - אירועים לפי יום
- טבלת פירוט אירועים
- **כפתור "השבת דשבורד"** בפינה העליונה עם AlertDialog:
  - כותרת: "השבתת דשבורד אנליטיקס"
  - הסבר: "הדשבורד יוסתר מכל המשתמשים. ניתן להפעיל מחדש דרך הדאטאבייס"
  - כפתורי "ביטול" ו"השבת"

### 6. ניווט
- Route חדש `/admin/analytics` ב-App.tsx
- לינק בתפריט UserMenu רק למשתמשים עם תפקיד admin (אייקון BarChart3)

## מבנה קבצים

```text
supabase/migrations/xxx.sql                    - טבלאות roles + settings
supabase/functions/get-analytics/index.ts      - שליפת נתונים
supabase/functions/toggle-analytics-dashboard/index.ts - הפעלה/השבתה
src/hooks/useIsAdmin.ts                        - בדיקת תפקיד
src/pages/AdminAnalytics.tsx                   - דף הדשבורד
src/App.tsx                                    - הוספת route
src/components/UserMenu.tsx                    - לינק לדשבורד
```

## הפעלה מחדש לאחר השבתה
הרצת שורה אחת ב-SQL Editor של Supabase:
```text
UPDATE app_settings SET value = 'true' WHERE key = 'analytics_dashboard_enabled';
```

## הסרה מלאה בעתיד
אם תרצה להסיר לגמרי מהקוד:
1. מחיקת AdminAnalytics.tsx, useIsAdmin.ts
2. מחיקת Edge Functions
3. הסרת Route מ-App.tsx והלינק מ-UserMenu
4. טבלאות user_roles ו-app_settings אפשר להשאיר לשימוש עתידי

