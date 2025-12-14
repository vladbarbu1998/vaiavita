-- Add source column to contact_submissions to differentiate between contact form and chatbot
ALTER TABLE public.contact_submissions 
ADD COLUMN source TEXT DEFAULT 'contact_form';

-- Add comment for documentation
COMMENT ON COLUMN public.contact_submissions.source IS 'Source of the submission: contact_form or chatbot';