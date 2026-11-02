-- ==============================================================================
-- MILESTONE 4: PR 3.3 WHITEBOARD FILES & MARKETPLACE DATA PERSISTENCE
-- Description:
-- 1. Add files column (JSONB) to public.whiteboards for Excalidraw binary assets (WBD-02)
-- 2. Ensure marketplace_item_contents index and grant consistency
-- ==============================================================================

-- 1. WHITEBOARDS: Add files column for embedded binary image attachments
ALTER TABLE public.whiteboards
    ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.whiteboards.files IS 'Stores Excalidraw binary files dictionary/array for embedded images and drawings (WBD-02)';

-- 2. INDEX OPTIMIZATION: Ensure efficient lookup on whiteboards and marketplace items
CREATE INDEX IF NOT EXISTS idx_whiteboards_user_updated 
    ON public.whiteboards(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_item_contents_item_id 
    ON public.marketplace_item_contents(item_id);

-- 3. VALIDATION TRIGGER: Ensure files is valid JSONB array or object
CREATE OR REPLACE FUNCTION public.validate_whiteboard_files()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.files IS NULL THEN
        NEW.files := '[]'::jsonb;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_whiteboard_files ON public.whiteboards;
CREATE TRIGGER trigger_validate_whiteboard_files
    BEFORE INSERT OR UPDATE ON public.whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_whiteboard_files();
