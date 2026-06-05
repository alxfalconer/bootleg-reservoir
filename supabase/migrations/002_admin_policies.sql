-- Allow a depositor to publish or update their own artifacts
create policy "owner update" on artifacts
  for update using (auth.uid() = deposited_by);

-- Allow a depositor to delete their own artifacts
create policy "owner delete" on artifacts
  for delete using (auth.uid() = deposited_by);
