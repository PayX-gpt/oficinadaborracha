
-- Storage bucket for receipts and photos
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- RLS for uploads bucket
CREATE POLICY "authenticated_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
