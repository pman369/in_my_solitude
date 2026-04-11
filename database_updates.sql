-- Enable read access for all users on activity_logs
CREATE POLICY "Enable read access for all users"
ON "public"."activity_logs"
FOR SELECT USING (true);
