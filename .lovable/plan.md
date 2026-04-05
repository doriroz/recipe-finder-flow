
# 🎬 The Cinematic Dashboard Rebuild Plan

Based on your interview answers:
- **North Star**: Playful 🎮 – warm, fun, energetic, like a home kitchen with personality
- **Transitions**: Parallax Depth – layered scrolling with elements floating at different speeds
- **Card Distinction**: Opacity Split – saved recipes at full opacity/bold, inspiration cards at ~70% with a lighter feel
- **AI Command Bar**: Active search bar above gallery – "מה נבשל מהספר שלך היום?"

---

## Architecture (3 Zones + Bottom Nav)

### Zone 1: The Active Engine (Hero)
- Cinematic title "מה נבשל היום?" with playful bounce
- Two action cards side-by-side:
  - **מתכונים פופולריים** (Globe icon, orange badge "מהעולם")
  - **בנו מתכון מהמקרר** (AI stars icon, purple badge "עוזר AI")
- Prominent glowing CTA: "בואו נבשל!"
- Blurred food background with parallax offset
- Glassmorphism container

### Zone 2: Heritage Row (Middle)
- Warm parchment gradient background shift (parallax layer 2)
- Camera icon + "שימור זיכרון משפחתי" title
- Minimalist upload row (photo + manual entry)
- Heritage badge "מורשת משפחתית"
- Clean direct-upload button

### Zone 3: The Living Vault (Gallery)
- Parchment/beige section background (parallax layer 3)
- **AI Command Bar**: Active search input "מה נבשל מהספר שלך היום?" with sparkle icon
- Filter tabs: הכל | מורשת | AI | מהעולם
- Responsive grid with **Opacity Split**:
  - Saved recipes: full opacity, bold border, source badge
  - Inspiration (Spoonacular): 70% opacity, "השראה לספר" badge, lighter styling
- Hover: scale-105 + shadow lift
- Empty state with Spoonacular everyday recipes (Quick Dinners, Family Classics, Healthy Snacks)
- FAB button: "התחל לבשל או לשמר זיכרון!"

### Fixed Bottom Nav
- 4 tabs: cookbook | discovery | profile | chat

### Technical Details
- CSS parallax via `perspective` + `translateZ` or scroll-based transform
- Staggered fade-in animations for cards
- All colors from design system tokens
- Spoonacular sample images for empty/inspiration state
- RTL layout maintained throughout
