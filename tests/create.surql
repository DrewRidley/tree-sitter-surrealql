-- Create a new record with a text id
CREATE person SET
    name = 'Tobie',
    company = 'SurrealDB',
    skills = ['Rust', 'Go', 'JavaScript'];


-- Create a new record with a numeric id
CREATE person:100 CONTENT {
name: 'Tobie',
company: 'SurrealDB',
skills: ['Rust', 'Go', 'JavaScript'],
};


-- Note: meta::tb(id) returns just the table name portion of a record ID
CREATE townsperson, cat, dog SET
    created_at = time::now(),
    name = "Just a " + meta::tb(id);


-- -- Creates three townperson records with a random ID
-- CREATE |townsperson:3|;



-- CREATE dog, |cat:2|, |townsperson:1..3| SET
--     created_at = time::now(),
--     name = "Just a " + meta::tb(id);



-- -- Returns just a single record
-- CREATE ONLY person:tobie SET
--     name = 'Tobie',
--     company = 'SurrealDB',
--     skills = ['Rust', 'Go', 'JavaScript'];


-- -- Create 10000 records but don't show any of them
-- CREATE |person:10000| SET age = 46, username = "john-smith" RETURN NONE;


-- -- Will always return NONE
-- CREATE person SET age = 46, username = "john-smith" RETURN BEFORE;

-- -- Return the record after creation
-- CREATE person SET age = 46, username = "john-smith" RETURN AFTER;


-- CREATE person
--     SET age = 46,
--     username = "john-smith",
--     interests = ['skiing', 'music']
-- RETURN
--     age,
--     interests,
--     age + 1 AS age_next_year;

-- CREATE |person:5|
--     SET age = 20
-- RETURN VALUE age;

-- -- Query attempting to create half a million `person` records
-- CREATE |person:500000| SET age = 46, username = "john-smith" TIMEOUT 500ms;

-- CREATE person:26, CREATE person:27 PARALLEL;
