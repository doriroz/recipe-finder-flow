export interface CategoryRecipe {
  title: string;
  ingredients: string[];
  cookingTime: number;
  difficulty: string;
}

export interface CuisineCategory {
  id: string;
  name: string;
  nameHe: string;
  subtitle: string;
  emoji: string;
  hue: string;
  type: "cuisine" | "meal";
  recipes: CategoryRecipe[];
}

export const CUISINE_CATEGORIES: CuisineCategory[] = [
  {
    id: "italian",
    name: "Italian",
    nameHe: "איטלקי",
    subtitle: "פסטה, פיצה ועוד",
    emoji: "🍝",
    hue: "32 65% 82%",
    type: "cuisine",
    recipes: [
      { title: "פסטה קרבונרה", ingredients: ["ספגטי", "ביצים", "גבינת פרמזן", "בייקון", "שמן זית", "פלפל שחור"], cookingTime: 25, difficulty: "קל" },
      { title: "פיצה מרגריטה", ingredients: ["בצק פיצה", "רוטב עגבניות", "מוצרלה", "בזיליקום", "שמן זית"], cookingTime: 30, difficulty: "בינוני" },
      { title: "ברוסקטה", ingredients: ["לחם צרפתי", "עגבניות", "שום", "בזיליקום", "שמן זית", "מלח"], cookingTime: 15, difficulty: "קל" },
    ],
  },
  {
    id: "asian",
    name: "Asian",
    nameHe: "אסייתי",
    subtitle: "טעמים מהמזרח",
    emoji: "🥢",
    hue: "355 55% 82%",
    type: "cuisine",
    recipes: [
      { title: "אורז מוקפץ", ingredients: ["אורז", "ביצים", "בצל ירוק", "שמן שומשום", "סויה", "ירקות מעורבים"], cookingTime: 20, difficulty: "קל" },
      { title: "עוף טריאקי", ingredients: ["חזה עוף", "סויה", "דבש", "שום", "ג'ינג'ר", "שמן שומשום", "אורז"], cookingTime: 30, difficulty: "בינוני" },
      { title: "פאד תאי", ingredients: ["אטריות אורז", "ביצים", "בוטנים", "בצל ירוק", "סויה", "ליים", "טופו"], cookingTime: 25, difficulty: "בינוני" },
    ],
  },
  {
    id: "mediterranean",
    name: "Mediterranean",
    nameHe: "ים תיכוני",
    subtitle: "בריא וטרי",
    emoji: "🫒",
    hue: "142 45% 82%",
    type: "cuisine",
    recipes: [
      { title: "סלט יווני", ingredients: ["מלפפון", "עגבניות", "גבינת פטה", "זיתים", "בצל סגול", "שמן זית"], cookingTime: 10, difficulty: "קל" },
      { title: "פלאפל", ingredients: ["חומוס", "פטרוזיליה", "בצל", "שום", "כמון", "שמן לטיגון"], cookingTime: 35, difficulty: "בינוני" },
      { title: "חומוס ביתי", ingredients: ["חומוס", "טחינה", "שום", "לימון", "שמן זית", "פפריקה"], cookingTime: 15, difficulty: "קל" },
      { title: "שקשוקה", ingredients: ["ביצים", "עגבניות", "פלפל", "בצל", "שום", "כמון", "פפריקה"], cookingTime: 25, difficulty: "קל" },
    ],
  },
  {
    id: "american",
    name: "American",
    nameHe: "אמריקאי",
    subtitle: "קלאסיקה אמריקאית",
    emoji: "🍔",
    hue: "48 70% 81%",
    type: "cuisine",
    recipes: [
      { title: "המבורגר קלאסי", ingredients: ["בשר טחון", "לחמניה", "חסה", "עגבנייה", "בצל", "גבינה צהובה", "קטשופ"], cookingTime: 20, difficulty: "קל" },
      { title: "מק אנד צ׳יז", ingredients: ["פסטה", "גבינה צהובה", "חלב", "חמאה", "קמח", "מלח"], cookingTime: 25, difficulty: "קל" },
      { title: "טוסט גבינה", ingredients: ["לחם לבן", "גבינה צהובה", "חמאה"], cookingTime: 10, difficulty: "קל" },
    ],
  },
  {
    id: "mexican",
    name: "Mexican",
    nameHe: "מקסיקני",
    subtitle: "חריף וטעים",
    emoji: "🌮",
    hue: "18 60% 81%",
    type: "cuisine",
    recipes: [
      { title: "Beef Tacos", ingredients: ["בשר טחון", "טורטייה", "חסה", "עגבנייה", "גבינה", "סלסה", "שמנת חמוצה"], cookingTime: 25, difficulty: "קל" },
      { title: "Quesadilla", ingredients: ["טורטייה", "גבינה צהובה", "פלפל", "בצל", "שמנת חמוצה"], cookingTime: 15, difficulty: "קל" },
      { title: "Guacamole", ingredients: ["אבוקדו", "בצל", "עגבנייה", "כוסברה", "ליים", "מלח"], cookingTime: 10, difficulty: "קל" },
    ],
  },
  {
    id: "breakfast",
    name: "Breakfast",
    nameHe: "ארוחת בוקר",
    subtitle: "התחלה טובה ליום",
    emoji: "🥞",
    hue: "270 45% 82%",
    type: "meal",
    recipes: [
      { title: "Classic Pancakes", ingredients: ["קמח", "ביצים", "חלב", "סוכר", "אבקת אפייה", "חמאה"], cookingTime: 20, difficulty: "קל" },
      { title: "Scrambled Eggs", ingredients: ["ביצים", "חמאה", "מלח", "פלפל"], cookingTime: 10, difficulty: "קל" },
      { title: "French Toast", ingredients: ["לחם", "ביצים", "חלב", "קינמון", "סוכר", "חמאה"], cookingTime: 15, difficulty: "קל" },
      { title: "Avocado Toast", ingredients: ["לחם", "אבוקדו", "ליים", "מלח", "פלפל", "ביצה"], cookingTime: 10, difficulty: "קל" },
    ],
  },
];
