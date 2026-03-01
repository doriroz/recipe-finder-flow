-- Insert core anchor vegetables (only if they don't already exist)
INSERT INTO ingredients (name, category, emoji, is_core_anchor)
SELECT v.name, v.category, v.emoji, true
FROM (VALUES
  ('חציל', 'ירקות', '🍆'),
  ('כרוב', 'ירקות', '🥬'),
  ('תפוח אדמה', 'ירקות', '🥔'),
  ('בטטה', 'ירקות', '🍠'),
  ('כרובית', 'ירקות', '🥦'),
  ('דלעת', 'ירקות', '🎃')
) AS v(name, category, emoji)
WHERE NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.name = v.name);

-- Update existing ones to be core anchors
UPDATE ingredients SET is_core_anchor = true WHERE name IN ('חציל', 'כרוב', 'תפוח אדמה', 'בטטה', 'כרובית', 'דלעת');