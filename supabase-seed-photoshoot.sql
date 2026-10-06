-- Run this in Supabase Dashboard -> SQL Editor
-- Adds the category column (if missing) and seeds the photo-shoot shopping tasks.
-- Safe to re-run: tasks whose title already exists are skipped.

alter table public.chalaka_tasks
  add column if not exists category text not null default 'גרפיקה'
    check (category in ('מתנות', 'קניות לצילומים', 'קניות לחלאקה', 'אוכל', 'לחיים בטקס עצמו', 'גרפיקה'));

notify pgrst, 'reload schema';

insert into public.chalaka_tasks (title, description, assignee_name, category, status)
select v.title, v.description, v.assignee_name, 'קניות לצילומים', 'todo'
from (values
  ('לוק אבא - סשן זיתים (חום)', 'מכנסיים שחורות, חולצה לבנה (עדיפות לסריג חום כהה), כיפה חדשה, נעלי שבת', 'אבא'),
  ('לוק אמא - סשן זיתים (חום)', 'לוק בגווני החום סגנון ספורט-אלגנט (קזואל) + נעליים מותאמות', 'אמא'),
  ('לוק אבי - סשן זיתים (חום)', 'לוק בגווני החום: מכנס/סרבל משובץ + חולצת סריג, גרבי ברך, נעליים חומות', 'אמא'),
  ('ציוד - סט קטיף זיתים', '3 קופסאות שימורים של זיתים חומות', 'אבא'),
  ('לוק אבי - סשן נדנדה', 'לוק של לוסו (צבעים: בז, שמנת, חום)', 'אמא'),
  ('לוק אבא - סשן ג''יפ', 'שחור, לבן, נעלי יומחול, סריג שחור/ירוק חאקי', 'אבא'),
  ('לוק אמא - סשן ג''יפ', 'שמלה מתאימה בסגנון, ג''ינס שחור / ירוק חאקי', 'אמא'),
  ('לוק אבי - סשן ג''יפ', 'סרבל שחור / ירוק ג''ינס / מכנס, פוטר בהיר שמנת, ג''קט ג''ינס שחור / ירוק חאקי', 'אמא'),
  ('אביזרים - סשן ג''יפ', 'כובע שמש / כובע חורפי מתאים, משקפי שמש', 'רותי'),
  ('אביזרים - תמונה יהודית/חלאקה', 'ציצית, קסקט', 'תהילה')
) as v(title, description, assignee_name)
where not exists (
  select 1 from public.chalaka_tasks t where t.title = v.title
);
