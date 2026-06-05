alter table artifacts add column if not exists deposit_year int;

-- 2021
update artifacts set
  deposit_year = 2021,
  uploaded_at = regexp_replace(uploaded_at, '2026', '2021')
where id in ('rsv-0001', 'rsv-0002', 'rsv-0003', 'rsv-0004');

-- 2023
update artifacts set
  deposit_year = 2023,
  uploaded_at = regexp_replace(uploaded_at, '2026', '2023')
where id in ('rsv-0005', 'rsv-0006', 'rsv-0007', 'rsv-0008', 'rsv-0009');

-- 2024
update artifacts set
  deposit_year = 2024,
  uploaded_at = regexp_replace(uploaded_at, '2026', '2024')
where id in ('rsv-0010', 'rsv-0011', 'rsv-0012', 'rsv-0013', 'rsv-0014');

-- 2025
update artifacts set
  deposit_year = 2025,
  uploaded_at = regexp_replace(uploaded_at, '2026', '2025')
where id in ('rsv-0015', 'rsv-0016', 'rsv-0017', 'rsv-0018', 'rsv-0019');

-- 2026
update artifacts set
  deposit_year = 2026
where id in ('rsv-0020', 'rsv-0021', 'rsv-0022', 'rsv-0023', 'rsv-0024');
