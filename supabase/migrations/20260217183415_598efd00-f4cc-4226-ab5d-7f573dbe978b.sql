
-- 1. Recipe library for local matching (pre-seeded base recipes)
CREATE TABLE public.recipe_library (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  ingredient_names text[] NOT NULL DEFAULT '{}',
  instructions text[] NOT NULL DEFAULT '{}',
  substitutions jsonb DEFAULT '[]'::jsonb,
  cooking_time integer,
  difficulty text DEFAULT 'medium',
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read recipe library" ON public.recipe_library FOR SELECT USING (true);

-- Index for ingredient matching
CREATE INDEX idx_recipe_library_ingredients ON public.recipe_library USING GIN (ingredient_names);

-- 2. Ingredient substitutions lookup table
CREATE TABLE public.ingredient_substitutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_ingredient text NOT NULL,
  alternative_ingredient text NOT NULL,
  reason text NOT NULL,
  confidence text NOT NULL DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  is_valid boolean NOT NULL DEFAULT true,
  tips text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(original_ingredient, alternative_ingredient)
);

ALTER TABLE public.ingredient_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read substitutions" ON public.ingredient_substitutions FOR SELECT USING (true);

-- 3. AI usage logs for cost tracking
CREATE TABLE public.ai_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action_type text NOT NULL,
  tokens_estimated integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  source text DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert ai logs" ON public.ai_usage_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own ai logs" ON public.ai_usage_logs FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_logs_user ON public.ai_usage_logs (user_id, created_at);
CREATE INDEX idx_ai_usage_logs_action ON public.ai_usage_logs (action_type);

-- 4. User credits table
CREATE TABLE public.user_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  credits_remaining integer NOT NULL DEFAULT 10,
  daily_ai_calls integer NOT NULL DEFAULT 0,
  daily_reset_at timestamptz NOT NULL DEFAULT now(),
  total_ai_calls integer NOT NULL DEFAULT 0,
  total_local_matches integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON public.user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. AI config (global caps)
INSERT INTO public.app_settings (key, value) VALUES ('ai_daily_global_cap', '500') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('ai_daily_user_cap', '20') ON CONFLICT (key) DO NOTHING;

-- 6. Seed some common substitutions
INSERT INTO public.ingredient_substitutions (original_ingredient, alternative_ingredient, reason, confidence, tips) VALUES
('חמאה', 'שמן זית', 'שמן זית מספק שומן דומה עם פרופיל טעם שונה', 'high', 'השתמשו ב-3/4 מהכמות'),
('חמאה', 'מרגרינה', 'תחליף ישיר עם מרקם דומה', 'high', NULL),
('חלב', 'חלב שקדים', 'תחליף צמחי עם מרקם דומה', 'high', 'מתאים לאפייה קלה'),
('חלב', 'חלב סויה', 'תחליף צמחי עשיר בחלבון', 'high', NULL),
('חלב', 'חלב קוקוס', 'מוסיף עשירות וטעם קוקוס עדין', 'medium', 'מתאים יותר למתכונים אסייתיים'),
('ביצים', 'טופו טחון', 'מספק קשירה ולחות דומה', 'medium', 'השתמשו ב-60 גרם לכל ביצה'),
('קמח רגיל', 'קמח כוסמין', 'תחליף בריא יותר עם טעם אגוזי', 'high', NULL),
('קמח רגיל', 'קמח שקדים', 'תחליף ללא גלוטן', 'medium', 'דורש תוספת ביצה לקשירה'),
('סוכר', 'דבש', 'ממתיק טבעי עם טעם עשיר', 'high', 'הפחיתו כמות נוזלים ב-1/4 כוס'),
('סוכר', 'סטיביה', 'ממתיק ללא קלוריות', 'medium', 'השתמשו בכמות קטנה יותר'),
('שמנת מתוקה', 'חלב קוקוס שמן', 'תחליף טבעוני עשיר', 'high', NULL),
('גבינת שמנת', 'טופו רך', 'תחליף טבעוני לממרחים ורטבים', 'medium', 'הוסיפו מעט לימון'),
('בצל', 'כרישה', 'טעם עדין יותר אך דומה', 'high', NULL),
('שום', 'שום גרנולה', 'נוח לשימוש עם טעם פחות חריף', 'high', '1/4 כפית לכל שן שום');

-- 7. Seed some base recipes for local matching
INSERT INTO public.recipe_library (title, ingredients, ingredient_names, instructions, cooking_time, difficulty, category) VALUES
('פסטה ברוטב עגבניות', 
 '[{"name":"פסטה","amount":"400","unit":"גרם"},{"name":"עגבניות","amount":"4","unit":"יחידות"},{"name":"שום","amount":"3","unit":"שיניים"},{"name":"בצל","amount":"1","unit":"יחידה"},{"name":"שמן זית","amount":"3","unit":"כפות"},{"name":"מלח","amount":"","unit":"לפי הטעם"},{"name":"בזיליקום","amount":"","unit":"לפי הטעם"}]',
 ARRAY['פסטה','עגבניות','שום','בצל','שמן זית','מלח','בזיליקום'],
 ARRAY['הרתיחו מים עם מלח ובשלו את הפסטה לפי הוראות האריזה','חתכו את הבצל והשום לקוביות קטנות','חממו שמן זית במחבת ושפתו את הבצל עד שקוף','הוסיפו שום וטגנו דקה נוספת','הוסיפו עגבניות חתוכות ובשלו 15 דקות','תבלו במלח ובבזיליקום','ערבבו את הרוטב עם הפסטה והגישו'],
 25, 'low', 'איטלקי'),

('חביתה עם ירקות',
 '[{"name":"ביצים","amount":"3","unit":"יחידות"},{"name":"פלפל","amount":"1","unit":"יחידה"},{"name":"עגבנייה","amount":"1","unit":"יחידה"},{"name":"בצל","amount":"0.5","unit":"יחידה"},{"name":"מלח","amount":"","unit":"לפי הטעם"},{"name":"פלפל שחור","amount":"","unit":"לפי הטעם"},{"name":"שמן","amount":"1","unit":"כף"}]',
 ARRAY['ביצים','פלפל','עגבנייה','בצל','מלח','פלפל שחור','שמן'],
 ARRAY['חתכו את כל הירקות לקוביות קטנות','טרפו את הביצים עם מלח ופלפל','חממו שמן במחבת','טגנו את הבצל והפלפל 3 דקות','שפכו את הביצים על הירקות','בשלו על אש נמוכה 5 דקות','הפכו והמשיכו דקה נוספת'],
 10, 'low', 'ארוחת בוקר'),

('סלט ירקות ישראלי',
 '[{"name":"עגבנייה","amount":"3","unit":"יחידות"},{"name":"מלפפון","amount":"2","unit":"יחידות"},{"name":"בצל","amount":"1","unit":"יחידה"},{"name":"לימון","amount":"1","unit":"יחידה"},{"name":"שמן זית","amount":"3","unit":"כפות"},{"name":"מלח","amount":"","unit":"לפי הטעם"},{"name":"פטרוזיליה","amount":"","unit":"לפי הטעם"}]',
 ARRAY['עגבנייה','מלפפון','בצל','לימון','שמן זית','מלח','פטרוזיליה'],
 ARRAY['חתכו עגבניות ומלפפונים לקוביות קטנות','חתכו בצל דק','קצצו פטרוזיליה','ערבבו את כל הירקות בקערה','תבלו בלימון, שמן זית ומלח','ערבבו היטב והגישו מיד'],
 10, 'low', 'סלטים'),

('עוף בתנור עם ירקות',
 '[{"name":"חזה עוף","amount":"4","unit":"יחידות"},{"name":"תפוחי אדמה","amount":"4","unit":"יחידות"},{"name":"גזר","amount":"3","unit":"יחידות"},{"name":"בצל","amount":"2","unit":"יחידות"},{"name":"שמן זית","amount":"3","unit":"כפות"},{"name":"פפריקה","amount":"1","unit":"כפית"},{"name":"מלח","amount":"","unit":"לפי הטעם"},{"name":"רוזמרין","amount":"","unit":"לפי הטעם"}]',
 ARRAY['חזה עוף','תפוחי אדמה','גזר','בצל','שמן זית','פפריקה','מלח','רוזמרין'],
 ARRAY['חממו תנור ל-200 מעלות','חתכו ירקות לחתיכות גדולות','שימו את העוף והירקות בתבנית','תבלו בשמן זית, פפריקה, מלח ורוזמרין','אפו 45 דקות עד שהעוף מוזהב','הוציאו מהתנור ותנו לנוח 5 דקות','הגישו חם'],
 50, 'medium', 'ארוחה עיקרית'),

('שקשוקה',
 '[{"name":"ביצים","amount":"4","unit":"יחידות"},{"name":"עגבניות","amount":"4","unit":"יחידות"},{"name":"פלפל","amount":"1","unit":"יחידה"},{"name":"בצל","amount":"1","unit":"יחידה"},{"name":"שום","amount":"2","unit":"שיניים"},{"name":"פפריקה","amount":"1","unit":"כפית"},{"name":"כמון","amount":"0.5","unit":"כפית"},{"name":"שמן זית","amount":"2","unit":"כפות"},{"name":"מלח","amount":"","unit":"לפי הטעם"}]',
 ARRAY['ביצים','עגבניות','פלפל','בצל','שום','פפריקה','כמון','שמן זית','מלח'],
 ARRAY['חתכו בצל, פלפל ושום','חממו שמן זית במחבת עמוקה','טגנו בצל ופלפל 5 דקות','הוסיפו שום וטגנו דקה','הוסיפו עגבניות חתוכות, פפריקה וכמון','בשלו 15 דקות עד שהרוטב מסמיך','צרו גומות בתוך הרוטב ושברו ביצים לתוכן','כסו ובשלו 5-7 דקות עד שהביצים מוכנות','הגישו עם לחם טרי'],
 30, 'medium', 'ארוחת בוקר'),

('אורז עם ירקות מוקפצים',
 '[{"name":"אורז","amount":"2","unit":"כוסות"},{"name":"גזר","amount":"2","unit":"יחידות"},{"name":"שעועית ירוקה","amount":"1","unit":"כוס"},{"name":"בצל","amount":"1","unit":"יחידה"},{"name":"שום","amount":"2","unit":"שיניים"},{"name":"רוטב סויה","amount":"3","unit":"כפות"},{"name":"שמן","amount":"2","unit":"כפות"},{"name":"מלח","amount":"","unit":"לפי הטעם"}]',
 ARRAY['אורז','גזר','שעועית ירוקה','בצל','שום','רוטב סויה','שמן','מלח'],
 ARRAY['בשלו אורז לפי הוראות','חתכו את כל הירקות','חממו שמן בווק או מחבת גדולה','טגנו בצל ושום דקה','הוסיפו גזר ושעועית וטגנו 5 דקות','הוסיפו את האורז המבושל','תבלו ברוטב סויה וערבבו','הגישו חם'],
 25, 'low', 'אסייתי');
