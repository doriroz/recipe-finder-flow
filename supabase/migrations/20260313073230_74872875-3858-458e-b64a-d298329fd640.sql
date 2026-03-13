-- Delete corrupted "חביתה בלחם" recipe with troll instructions
DELETE FROM recipes WHERE id = 'de916c6a-a554-4a64-9b41-4139da02724c';

-- Delete duplicate "חביתה עם ירקות" recipes, keeping only the newest one (2edf69c1)
DELETE FROM recipes WHERE title = 'חביתה עם ירקות' AND id != '2edf69c1-0d47-4bfc-83b9-907d03538b28';

-- Delete corrupted translation cache entry
DELETE FROM translation_cache WHERE id = 'bad56ee2-9254-4cb9-825b-4f108352fe42';