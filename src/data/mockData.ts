// Mock data for the cooking app

export const ingredients = [
  { id: 1, name: "עגבניה", emoji: "🍅", category: "ירקות" },
  { id: 2, name: "ביצה", emoji: "🥚", category: "חלבי" },
  { id: 3, name: "קמח", emoji: "🌾", category: "יבשים" },
  { id: 4, name: "בצל", emoji: "🧅", category: "ירקות" },
  { id: 5, name: "שום", emoji: "🧄", category: "ירקות" },
  { id: 6, name: "גבינה צהובה", emoji: "🧀", category: "חלבי" },
  { id: 7, name: "לחם", emoji: "🍞", category: "יבשים" },
  { id: 8, name: "חלב", emoji: "🥛", category: "חלבי" },
  { id: 9, name: "פלפל", emoji: "🫑", category: "ירקות" },
  { id: 10, name: "תפוח אדמה", emoji: "🥔", category: "ירקות" },
  { id: 11, name: "גזר", emoji: "🥕", category: "ירקות" },
  { id: 12, name: "פסטה", emoji: "🍝", category: "יבשים" },
  { id: 13, name: "אורז", emoji: "🍚", category: "יבשים" },
  { id: 14, name: "עוף", emoji: "🍗", category: "בשרי" },
  { id: 15, name: "לימון", emoji: "🍋", category: "פירות" },
  { id: 16, name: "שמן זית", emoji: "🫒", category: "שמנים" },
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
