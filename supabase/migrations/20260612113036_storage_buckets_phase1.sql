-- Phase 1d: Storage buckets for avatars and team assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars',     'avatars',     true, 3145728,  ARRAY['image/jpeg','image/png','image/webp']),
  ('team-assets', 'team-assets', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- avatars: path convention {user_id}/avatar.webp, {user_id}/cover.webp
CREATE POLICY avatars_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatars_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatars_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- team-assets: path convention {team_id}/logo.webp, {team_id}/banner.webp
CREATE POLICY teamassets_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-assets'
    AND public.team_role(((storage.foldername(name))[1])::uuid, auth.uid()) IN ('owner','admin'));
CREATE POLICY teamassets_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'team-assets'
    AND public.team_role(((storage.foldername(name))[1])::uuid, auth.uid()) IN ('owner','admin'));
CREATE POLICY teamassets_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'team-assets'
    AND public.team_role(((storage.foldername(name))[1])::uuid, auth.uid()) IN ('owner','admin'));
