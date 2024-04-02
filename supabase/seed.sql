-- DEV
INSERT INTO products (id, name) VALUES (173086, 'Free');
INSERT INTO products (id, name) VALUES (173087, 'Plus');
INSERT INTO products (id, name) VALUES (173072, 'Boost');

INSERT INTO variants (id, name, price, product_id) VALUES (222651, 'Free', 0, 173086);
INSERT INTO variants (id, name, price, product_id) VALUES (222652, 'Plus', 299, 173087);
INSERT INTO variants (id, name, price, product_id) VALUES (222623, '1,500 Voters', 499, 173072);
INSERT INTO variants (id, name, price, product_id) VALUES (222640, '2,500 Voters', 699, 173072);
INSERT INTO variants (id, name, price, product_id) VALUES (222641, '5,000 Voters', 899, 173072);
INSERT INTO variants (id, name, price, product_id) VALUES (222643, '7,500 Voters', 1099, 173072);
INSERT INTO variants (id, name, price, product_id) VALUES (222644, '10,000 Voters', 1299, 173072);

-- PROD
-- INSERT INTO products (id, name) VALUES (173116, 'Free');
-- INSERT INTO products (id, name) VALUES (173117, 'Plus');
-- INSERT INTO products (id, name) VALUES (173113, 'Boost');

-- INSERT INTO variants (id, name, price, product_id) VALUES (222708, 'Free', 0, 173116);
-- INSERT INTO variants (id, name, price, product_id) VALUES (222709, 'Plus', 299, 173117);
-- INSERT INTO variants (id, name, price, product_id) VALUES (222700, '1,500 Voters', 499, 173113);
-- INSERT INTO variants (id, name, price, product_id) VALUES (222701, '2,500 Voters', 699, 173113);
-- INSERT INTO variants (id, name, price, product_id) VALUES (222702, '5,000 Voters', 899, 173113);
-- INSERT INTO variants (id, name, price, product_id) VALUES (222703, '7,500 Voters', 1099, 173113);
-- INSERT INTO variants (id, name, price, product_id) VALUES (222704, '10,000 Voters', 1299, 173113);
