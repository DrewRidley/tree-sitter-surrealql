// Basic select
SELECT * FROM users GROUP BY age;

// Select with value clause
SELECT VALUE count() AS total FROM users;

// Select with function and order by
SELECT name, count() AS total FROM users GROUP BY country ORDER BY total DESC;

// Select with ONLY and WITH INDEX
SELECT * FROM ONLY users WITH INDEX idx_age;

// Select with NOINDEX
SELECT * FROM users WITH NOINDEX;

// Select with single OMIT
SELECT * FROM users OMIT password;

// Select with multiple OMIT
SELECT * FROM users OMIT password, secret_key;

// Select with SPLIT
SELECT * FROM orders SPLIT ON items;

// Select with complex WHERE
SELECT * FROM users WHERE age > 18;

// Select with ORDER BY options
SELECT * FROM users ORDER BY name ASC COLLATE NUMERIC;

// Select with pagination
SELECT * FROM users LIMIT 10 START AT 20;

// Complex combined query
SELECT VALUE count() AS total
FROM ONLY users
WITH INDEX idx_users
WHERE active = true
GROUP BY department
ORDER BY total DESC
LIMIT 100
START AT 0;

// Test FETCH
SELECT * FROM users FETCH avatar, profile_image;
