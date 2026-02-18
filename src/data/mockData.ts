// Mock data for the cooking app

export interface Ingredient {
  id: number;
  name: string;
  emoji: string;
  category: string;
  popularityScore: number;
}

export const CATEGORIES = [
  "ירקות",
  "חלבונים",
  "חלבי",
  "דגנים",
  "תבלינים",
  "שימורים",
  "פירות",
  "אחר",
] as const;

export const ingredients: Ingredient[] = [
  // ירקות
  { id: 1, name: "עגבניה", emoji: "🍅", category: "ירקות", popularityScore: 95 },
  { id: 4, name: "בצל", emoji: "🧅", category: "ירקות", popularityScore: 98 },
  { id: 5, name: "שום", emoji: "🧄", category: "ירקות", popularityScore: 97 },
  { id: 9, name: "פלפל", emoji: "🫑", category: "ירקות", popularityScore: 85 },
  { id: 10, name: "תפוח אדמה", emoji: "🥔", category: "ירקות", popularityScore: 90 },
  { id: 11, name: "גזר", emoji: "🥕", category: "ירקות", popularityScore: 82 },
  { id: 17, name: "מלפפון", emoji: "🥒", category: "ירקות", popularityScore: 80 },
  { id: 18, name: "חסה", emoji: "🥬", category: "ירקות", popularityScore: 70 },
  { id: 19, name: "כרובית", emoji: "🥦", category: "ירקות", popularityScore: 65 },
  { id: 20, name: "קישוא", emoji: "🥒", category: "ירקות", popularityScore: 72 },
  { id: 21, name: "חצילים", emoji: "🍆", category: "ירקות", popularityScore: 68 },
  { id: 22, name: "תירס", emoji: "🌽", category: "ירקות", popularityScore: 75 },
  { id: 23, name: "פטריות", emoji: "🍄", category: "ירקות", popularityScore: 78 },
  { id: 24, name: "ברוקולי", emoji: "🥦", category: "ירקות", popularityScore: 60 },
  { id: 25, name: "כרוב", emoji: "🥬", category: "ירקות", popularityScore: 58 },
  { id: 26, name: "סלרי", emoji: "🌿", category: "ירקות", popularityScore: 50 },
  { id: 27, name: "בטטה", emoji: "🍠", category: "ירקות", popularityScore: 74 },
  { id: 28, name: "פלפל אדום", emoji: "🌶️", category: "ירקות", popularityScore: 81 },
  { id: 29, name: "עגבניות שרי", emoji: "🍅", category: "ירקות", popularityScore: 76 },
  { id: 30, name: "בצל ירוק", emoji: "🌿", category: "ירקות", popularityScore: 73 },
  // חלבונים
  { id: 14, name: "עוף", emoji: "🍗", category: "חלבונים", popularityScore: 94 },
  { id: 31, name: "בשר טחון", emoji: "🥩", category: "חלבונים", popularityScore: 88 },
  { id: 32, name: "סלמון", emoji: "🐟", category: "חלבונים", popularityScore: 76 },
  { id: 33, name: "טונה", emoji: "🐟", category: "חלבונים", popularityScore: 84 },
  { id: 34, name: "נקניקיות", emoji: "🌭", category: "חלבונים", popularityScore: 70 },
  { id: 35, name: "חזה עוף", emoji: "🍗", category: "חלבונים", popularityScore: 91 },
  { id: 36, name: "שריות עוף", emoji: "🍖", category: "חלבונים", popularityScore: 80 },
  { id: 37, name: "בשר בקר", emoji: "🥩", category: "חלבונים", popularityScore: 75 },
  { id: 38, name: "דג סול", emoji: "🐟", category: "חלבונים", popularityScore: 55 },
  { id: 39, name: "ביצה", emoji: "🥚", category: "חלבונים", popularityScore: 96 },
  { id: 40, name: "חומוס (גרגרי)", emoji: "🫘", category: "חלבונים", popularityScore: 77 },
  { id: 41, name: "עדשים", emoji: "🫘", category: "חלבונים", popularityScore: 68 },
  { id: 42, name: "שעועית לבנה", emoji: "🫘", category: "חלבונים", popularityScore: 64 },
  { id: 43, name: "טופו", emoji: "🧊", category: "חלבונים", popularityScore: 52 },
  // חלבי
  { id: 2, name: "ביצה", emoji: "🥚", category: "חלבי", popularityScore: 96 },
  { id: 6, name: "גבינה צהובה", emoji: "🧀", category: "חלבי", popularityScore: 89 },
  { id: 8, name: "חלב", emoji: "🥛", category: "חלבי", popularityScore: 87 },
  { id: 44, name: "גבינת קוטג'", emoji: "🧀", category: "חלבי", popularityScore: 72 },
  { id: 45, name: "שמנת חמוצה", emoji: "🥛", category: "חלבי", popularityScore: 74 },
  { id: 46, name: "יוגורט", emoji: "🥛", category: "חלבי", popularityScore: 80 },
  { id: 47, name: "חמאה", emoji: "🧈", category: "חלבי", popularityScore: 85 },
  { id: 48, name: "גבינה לבנה", emoji: "🧀", category: "חלבי", popularityScore: 78 },
  { id: 49, name: "גבינת מוצרלה", emoji: "🧀", category: "חלבי", popularityScore: 71 },
  { id: 50, name: "שמנת מתוקה", emoji: "🥛", category: "חלבי", popularityScore: 66 },
  { id: 51, name: "פרמזן", emoji: "🧀", category: "חלבי", popularityScore: 63 },
  // דגנים
  { id: 3, name: "קמח", emoji: "🌾", category: "דגנים", popularityScore: 88 },
  { id: 7, name: "לחם", emoji: "🍞", category: "דגנים", popularityScore: 86 },
  { id: 12, name: "פסטה", emoji: "🍝", category: "דגנים", popularityScore: 92 },
  { id: 13, name: "אורז", emoji: "🍚", category: "דגנים", popularityScore: 93 },
  { id: 52, name: "קוסקוס", emoji: "🌾", category: "דגנים", popularityScore: 70 },
  { id: 53, name: "בורגול", emoji: "🌾", category: "דגנים", popularityScore: 62 },
  { id: 54, name: "שיבולת שועל", emoji: "🌾", category: "דגנים", popularityScore: 69 },
  { id: 55, name: "לחמניות", emoji: "🥖", category: "דגנים", popularityScore: 74 },
  { id: 56, name: "פיתה", emoji: "🫓", category: "דגנים", popularityScore: 85 },
  { id: 57, name: "לאפה", emoji: "🫓", category: "דגנים", popularityScore: 79 },
  { id: 58, name: "קינואה", emoji: "🌾", category: "דגנים", popularityScore: 58 },
  { id: 59, name: "פנקייק", emoji: "🥞", category: "דגנים", popularityScore: 55 },
  // תבלינים
  { id: 60, name: "מלח", emoji: "🧂", category: "תבלינים", popularityScore: 99 },
  { id: 61, name: "פלפל שחור", emoji: "⚫", category: "תבלינים", popularityScore: 98 },
  { id: 62, name: "פפריקה מתוקה", emoji: "🌶️", category: "תבלינים", popularityScore: 88 },
  { id: 63, name: "כמון", emoji: "🌿", category: "תבלינים", popularityScore: 82 },
  { id: 64, name: "כורכום", emoji: "🌿", category: "תבלינים", popularityScore: 76 },
  { id: 65, name: "רוזמרין", emoji: "🌿", category: "תבלינים", popularityScore: 70 },
  { id: 66, name: "תימין", emoji: "🌿", category: "תבלינים", popularityScore: 68 },
  { id: 67, name: "אורגנו", emoji: "🌿", category: "תבלינים", popularityScore: 72 },
  { id: 68, name: "בזיליקום", emoji: "🌿", category: "תבלינים", popularityScore: 74 },
  { id: 69, name: "סוכר", emoji: "🍬", category: "תבלינים", popularityScore: 85 },
  { id: 70, name: "דבש", emoji: "🍯", category: "תבלינים", popularityScore: 80 },
  { id: 71, name: "חרדל", emoji: "🫙", category: "תבלינים", popularityScore: 65 },
  { id: 72, name: "קינמון", emoji: "🌿", category: "תבלינים", popularityScore: 73 },
  { id: 73, name: "ג'ינג'ר", emoji: "🫚", category: "תבלינים", popularityScore: 69 },
  { id: 74, name: "פפריקה חריפה", emoji: "🌶️", category: "תבלינים", popularityScore: 77 },
  // שמנים
  { id: 16, name: "שמן זית", emoji: "🫒", category: "שמנים", popularityScore: 96 },
  { id: 75, name: "שמן קנולה", emoji: "🫚", category: "שמנים", popularityScore: 84 },
  { id: 76, name: "שמן שומשום", emoji: "🫚", category: "שמנים", popularityScore: 60 },
  { id: 77, name: "חומץ", emoji: "🫙", category: "שמנים", popularityScore: 72 },
  { id: 78, name: "רוטב סויה", emoji: "🫙", category: "שמנים", popularityScore: 68 },
  // שימורים
  { id: 79, name: "רסק עגבניות", emoji: "🥫", category: "שימורים", popularityScore: 87 },
  { id: 80, name: "שימורי תירס", emoji: "🥫", category: "שימורים", popularityScore: 78 },
  { id: 81, name: "שימורי טונה", emoji: "🥫", category: "שימורים", popularityScore: 82 },
  { id: 82, name: "שעועית שחורה שימורים", emoji: "🥫", category: "שימורים", popularityScore: 65 },
  { id: 83, name: "זיתים", emoji: "🫒", category: "שימורים", popularityScore: 74 },
  { id: 84, name: "חומוס מוכן", emoji: "🥫", category: "שימורים", popularityScore: 80 },
  { id: 85, name: "עגבניות מרוסקות", emoji: "🥫", category: "שימורים", popularityScore: 83 },
  { id: 86, name: "קוקוס חלב", emoji: "🥫", category: "שימורים", popularityScore: 58 },
  // פירות
  { id: 15, name: "לימון", emoji: "🍋", category: "פירות", popularityScore: 88 },
  { id: 87, name: "תפוח", emoji: "🍎", category: "פירות", popularityScore: 76 },
  { id: 88, name: "בננה", emoji: "🍌", category: "פירות", popularityScore: 74 },
  { id: 89, name: "תפוז", emoji: "🍊", category: "פירות", popularityScore: 72 },
  { id: 90, name: "אבוקדו", emoji: "🥑", category: "פירות", popularityScore: 82 },
  { id: 91, name: "אנגוריה", emoji: "🍇", category: "פירות", popularityScore: 62 },
  { id: 92, name: "תות שדה", emoji: "🍓", category: "פירות", popularityScore: 70 },
  { id: 93, name: "מנגו", emoji: "🥭", category: "פירות", popularityScore: 65 },
  // אחר
  { id: 94, name: "אגוזי מלך", emoji: "🥜", category: "אחר", popularityScore: 60 },
  { id: 95, name: "שקדים", emoji: "🌰", category: "אחר", popularityScore: 65 },
  { id: 96, name: "שוקולד", emoji: "🍫", category: "אחר", popularityScore: 72 },
  { id: 97, name: "שמרים", emoji: "🌾", category: "אחר", popularityScore: 58 },
  { id: 98, name: "אבקת אפייה", emoji: "🥄", category: "אחר", popularityScore: 55 },
  { id: 99, name: "וניל", emoji: "🌿", category: "אחר", popularityScore: 62 },
  { id: 100, name: "צימוקים", emoji: "🍇", category: "אחר", popularityScore: 54 },
];

export const mockRecipe = {
  id: 1,
  title: "שקשוקה קלאסית",
  description: "מנה ישראלית אהובה - ביצים ברוטב עגבניות עשיר",
  time: "25 דקות",
  difficulty: "קל",
  servings: 4,
  image: "🍳",
  ingredients: [
    "4 ביצים",
    "4 עגבניות בשלות",
    "1 בצל גדול",
    "3 שיני שום",
    "כף שמן זית",
    "מלח ופלפל לפי הטעם",
    "פטרוזיליה קצוצה להגשה"
  ],
  substitutions: [
    { original: "עגבניות טריות", alternative: "רסק עגבניות + מים", reason: "אם אין עגבניות טריות" },
    { original: "בצל", alternative: "כרישה", reason: "לטעם עדין יותר" },
  ],
  steps: [
    {
      number: 1,
      title: "הכנת הבסיס",
      instruction: "קצצו את הבצל לקוביות קטנות והשום לפרוסות דקות. חממו שמן זית במחבת רחבה על אש בינונית.",
      tip: "מחבת רחבה עם שוליים נמוכים היא האידיאלית לשקשוקה"
    },
    {
      number: 2,
      title: "טיגון הבצל",
      instruction: "הוסיפו את הבצל למחבת וטגנו כ-5 דקות עד שהוא הופך לשקוף. הוסיפו את השום וטגנו דקה נוספת.",
      tip: "אל תשרפו את השום - הוא הופך מר!"
    },
    {
      number: 3,
      title: "הכנת הרוטב",
      instruction: "קצצו את העגבניות לקוביות והוסיפו למחבת. בשלו על אש נמוכה כ-10 דקות עד שהעגבניות מתרככות ונוצר רוטב.",
      tip: "תבלו במלח ופלפל בשלב זה"
    },
    {
      number: 4,
      title: "הוספת הביצים",
      instruction: "צרו 4 גומות ברוטב בעזרת כף. שברו ביצה לתוך כל גומה בזהירות.",
      tip: "שברו את הביצה לקערית קטנה קודם - כך קל יותר להעביר"
    },
    {
      number: 5,
      title: "בישול סופי",
      instruction: "כסו את המחבת ובשלו 5-7 דקות על אש נמוכה, עד שהחלבון קרש אבל החלמון עדיין רך.",
      tip: "בדקו כל דקה - הביצים ממשיכות להתבשל גם אחרי שמורידים מהאש"
    },
    {
      number: 6,
      title: "הגשה",
      instruction: "פזרו פטרוזיליה קצוצה מעל והגישו מיד עם לחם טרי לטבילה.",
      tip: "השקשוקה הכי טעימה כשהיא חמה!"
    }
  ]
};

export const userDishes = [
  { id: 1, name: "שקשוקה ראשונה שלי", date: "15.01.2025", emoji: "🍳" },
  { id: 2, name: "פסטה ברוטב עגבניות", date: "12.01.2025", emoji: "🍝" },
  { id: 3, name: "חביתה עם ירקות", date: "10.01.2025", emoji: "🥚" },
  { id: 4, name: "סלט ירקות טרי", date: "08.01.2025", emoji: "🥗" },
  { id: 5, name: "טוסט גבינה", date: "05.01.2025", emoji: "🧀" },
  { id: 6, name: "אורז עם ירקות", date: "02.01.2025", emoji: "🍚" },
];
