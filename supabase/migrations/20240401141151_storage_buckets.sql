DELETE FROM storage.buckets WHERE id = 'elections';

DELETE FROM storage.buckets WHERE id = 'candidates';

DELETE FROM storage.buckets WHERE id = 'users';

INSERT INTO
storage.buckets (id, name, public)
VALUES('elections', 'elections', true);

INSERT INTO
storage.buckets (id, name, public)
VALUES('candidates', 'candidates', true);

INSERT INTO
storage.buckets (id, name, public)
VALUES('users', 'users', true);


