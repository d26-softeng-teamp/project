-- Rows that got a raw extension but aren't in any named group become "other"
UPDATE public.content_management
SET format = 'other'
WHERE format IS NOT NULL
  AND format NOT IN (
    'pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv',
    'png','jpg','jpeg','gif','svg'
  );

-- Also catch rows that had a filename with an extension but weren't backfilled
-- (e.g. files uploaded before the format column existed with unrecognised extensions)
UPDATE public.content_management
SET format = 'other'
WHERE format IS NULL
  AND filename IS NOT NULL
  AND filename ~ '\.[^.]+$';
