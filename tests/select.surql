// Basic SELECT variations
SELECT * FROM user;
SELECT name, age FROM user;
SELECT VALUE count() AS total FROM user;

// Dotted notation and field aliases
SELECT name.first, name.last AS surname FROM user;
SELECT address.city, string::uppercase(address.street) AS street FROM user;

// FROM clause variations
SELECT * FROM ONLY user;
SELECT * FROM user:john;
SELECT * FROM user:123;
SELECT * FROM (SELECT * FROM user);
SELECT * FROM [1, 2, 3];
SELECT * FROM user:john, company:acme;

// WITH clause
SELECT * FROM user WITH NOINDEX;
SELECT * FROM user WITH INDEX idx_name;

// WHERE conditions
SELECT * FROM user WHERE age >= 18;
SELECT * FROM article WHERE content CONTAINS 'test';
SELECT * FROM user WHERE age >= 18 AND status = 'active';
SELECT * FROM user WHERE (active AND verified) OR admin = true;

// Edge traversal examples
SELECT email FROM user:john->emails;
SELECT * FROM notification->recipients;

// GROUP BY variations (corrected)
SELECT country, count() AS count FROM user GROUP BY country;
SELECT department, math::mean(salary) AS avg_salary FROM employee GROUP BY department;
SELECT status, count() AS total FROM user GROUP BY status;
SELECT age, gender, count() AS total FROM user GROUP BY age, gender;

// GROUP ALL example
SELECT math::sum(amount) AS total FROM transaction GROUP ALL;

// ORDER BY variations
SELECT * FROM user ORDER BY rand();
SELECT * FROM user ORDER BY age DESC;
SELECT * FROM user ORDER BY country ASC, age DESC;
SELECT * FROM user ORDER BY name COLLATE ASC;
SELECT * FROM user ORDER BY version NUMERIC DESC;

// LIMIT and START
SELECT * FROM user LIMIT 10;
SELECT * FROM user LIMIT BY 10;
SELECT * FROM user START AT 20;
SELECT * FROM user LIMIT 10 START AT 20;

// FETCH
SELECT *, ->purchased->product AS purchases FROM user FETCH purchases;
SELECT *, <-follows AS followers FROM user FETCH followers;

// TIMEOUT
SELECT * FROM large_table TIMEOUT 30s;
SELECT * FROM huge_table TIMEOUT 1m;

// PARALLEL and TEMPFILES
SELECT * FROM user PARALLEL;
SELECT * FROM user TEMPFILES;
SELECT * FROM user PARALLEL TEMPFILES;

// EXPLAIN
SELECT * FROM user EXPLAIN;
SELECT * FROM user EXPLAIN FULL;

// Complex combinations (corrected)
SELECT status, count() AS total
FROM user
WHERE created > time::now() - 30d
GROUP BY status
ORDER BY total DESC
LIMIT 100
START AT 0
FETCH avatar
TIMEOUT 5s
PARALLEL
EXPLAIN FULL;

// Function calls with namespaces
SELECT time::now() AS current_time FROM user;
SELECT array::len(emails) AS email_count FROM user;
SELECT string::lowercase(name) AS lower_name FROM user;

// Multiple expressions in clauses
SELECT department, role, count() AS total
FROM user
WHERE age > 18
  AND status = 'active'
  OR role = 'admin'
GROUP BY department, role
ORDER BY total DESC, department ASC
FETCH profile, settings;

-- Omit the password field and security field in the options object
SELECT * OMIT password, opts.security FROM person;

-- Using destructuring syntax (since 2.0.0)
SELECT * OMIT password, opts.{ security, enabled } FROM person;
