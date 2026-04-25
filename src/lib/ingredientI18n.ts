// Hebrew <-> English mapping for the ~100 ingredients in mockData.ts
// Used by Spoonacular pairing logic to translate API responses back to local IDs.

export const HE_TO_EN: Record<string, string[]> = {
  // ירקות
  "עגבניה": ["tomato", "tomatoes"],
  "בצל": ["onion", "onions", "yellow onion"],
  "שום": ["garlic", "garlic clove", "garlic cloves"],
  "פלפל": ["bell pepper", "pepper", "green pepper"],
  "תפוח אדמה": ["potato", "potatoes"],
  "גזר": ["carrot", "carrots"],
  "מלפפון": ["cucumber", "cucumbers"],
  "חסה": ["lettuce", "romaine"],
  "כרובית": ["cauliflower"],
  "קישוא": ["zucchini", "courgette"],
  "חצילים": ["eggplant", "aubergine"],
  "תירס": ["corn", "sweet corn"],
  "פטריות": ["mushroom", "mushrooms"],
  "ברוקולי": ["broccoli"],
  "כרוב": ["cabbage"],
  "סלרי": ["celery"],
  "בטטה": ["sweet potato", "sweet potatoes"],
  "פלפל אדום": ["red bell pepper", "red pepper"],
  "עגבניות שרי": ["cherry tomato", "cherry tomatoes"],
  "בצל ירוק": ["green onion", "scallion", "scallions", "spring onion"],

  // חלבונים
  "עוף": ["chicken"],
  "בשר טחון": ["ground beef", "minced beef"],
  "סלמון": ["salmon"],
  "טונה": ["tuna"],
  "נקניקיות": ["sausage", "sausages", "hot dog"],
  "חזה עוף": ["chicken breast", "chicken breasts"],
  "שריות עוף": ["chicken thigh", "chicken thighs"],
  "בשר בקר": ["beef", "steak"],
  "דג סול": ["sole", "sole fish"],
  "ביצה": ["egg", "eggs"],
  "חומוס (גרגרי)": ["chickpea", "chickpeas", "garbanzo"],
  "עדשים": ["lentil", "lentils"],
  "שעועית לבנה": ["white bean", "white beans", "cannellini"],
  "טופו": ["tofu"],

  // חלבי
  "גבינה צהובה": ["cheese", "yellow cheese", "cheddar"],
  "חלב": ["milk"],
  "גבינת קוטג'": ["cottage cheese"],
  "שמנת חמוצה": ["sour cream"],
  "יוגורט": ["yogurt", "yoghurt"],
  "חמאה": ["butter"],
  "גבינה לבנה": ["cream cheese", "white cheese"],
  "גבינת מוצרלה": ["mozzarella"],
  "שמנת מתוקה": ["heavy cream", "whipping cream", "cream"],
  "פרמזן": ["parmesan", "parmigiano"],

  // דגנים
  "קמח": ["flour", "all-purpose flour"],
  "לחם": ["bread"],
  "פסטה": ["pasta", "spaghetti", "penne"],
  "אורז": ["rice"],
  "קוסקוס": ["couscous"],
  "בורגול": ["bulgur"],
  "שיבולת שועל": ["oats", "oatmeal", "rolled oats"],
  "לחמניות": ["bun", "buns", "roll", "rolls"],
  "פיתה": ["pita", "pita bread"],
  "לאפה": ["flatbread", "lavash"],
  "קינואה": ["quinoa"],
  "פנקייק": ["pancake", "pancakes"],

  // תבלינים
  "מלח": ["salt"],
  "פלפל שחור": ["black pepper", "pepper"],
  "פפריקה מתוקה": ["paprika", "sweet paprika"],
  "כמון": ["cumin"],
  "כורכום": ["turmeric"],
  "רוזמרין": ["rosemary"],
  "תימין": ["thyme"],
  "אורגנו": ["oregano"],
  "בזיליקום": ["basil"],
  "סוכר": ["sugar"],
  "דבש": ["honey"],
  "חרדל": ["mustard"],
  "קינמון": ["cinnamon"],
  "ג'ינג'ר": ["ginger"],
  "פפריקה חריפה": ["hot paprika", "cayenne"],

  // שמנים
  "שמן זית": ["olive oil"],
  "שמן קנולה": ["canola oil", "vegetable oil"],
  "שמן שומשום": ["sesame oil"],
  "חומץ": ["vinegar", "white vinegar"],
  "רוטב סויה": ["soy sauce"],

  // שימורים
  "רסק עגבניות": ["tomato paste"],
  "שימורי תירס": ["canned corn", "corn"],
  "שימורי טונה": ["canned tuna", "tuna"],
  "שעועית שחורה שימורים": ["black beans", "black bean"],
  "זיתים": ["olive", "olives"],
  "חומוס מוכן": ["hummus"],
  "עגבניות מרוסקות": ["crushed tomatoes", "diced tomatoes"],
  "קוקוס חלב": ["coconut milk"],

  // פירות
  "לימון": ["lemon", "lemon juice"],
  "תפוח": ["apple", "apples"],
  "בננה": ["banana", "bananas"],
  "תפוז": ["orange", "oranges"],
  "אבוקדו": ["avocado"],
  "אנגוריה": ["grape", "grapes"],
  "תות שדה": ["strawberry", "strawberries"],
  "מנגו": ["mango"],

  // אחר
  "אגוזי מלך": ["walnut", "walnuts"],
  "שקדים": ["almond", "almonds"],
  "שוקולד": ["chocolate"],
  "שמרים": ["yeast"],
  "אבקת אפייה": ["baking powder"],
  "וניל": ["vanilla", "vanilla extract"],
  "צימוקים": ["raisin", "raisins"],
};

// Reverse map: english (lowercase) -> hebrew name
export const EN_TO_HE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [he, ens] of Object.entries(HE_TO_EN)) {
    for (const en of ens) {
      map[en.toLowerCase()] = he;
    }
  }
  return map;
})();

export function getEnglishNames(hebrewName: string): string[] {
  return HE_TO_EN[hebrewName] ?? [];
}

export function getHebrewName(englishName: string): string | undefined {
  return EN_TO_HE[englishName.toLowerCase()];
}

// Fuzzy match: try to find Hebrew ingredient from a Spoonacular ingredient name
// (which might be "fresh tomatoes" or "diced onion")
export function fuzzyMatchHebrew(englishPhrase: string): string | undefined {
  const lower = englishPhrase.toLowerCase().trim();
  if (EN_TO_HE[lower]) return EN_TO_HE[lower];
  // Try each english key as a substring
  for (const [en, he] of Object.entries(EN_TO_HE)) {
    if (lower.includes(en)) return he;
  }
  return undefined;
}