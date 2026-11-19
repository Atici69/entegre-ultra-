-- Entegre Ultra initial MySQL schema.
-- Review and back up the target database before applying in production.
-- This migration intentionally creates only the shared operational foundation.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  auth_provider VARCHAR(30) NOT NULL DEFAULT 'pending',
  auth_subject VARCHAR(190) NULL,
  email VARCHAR(190) NOT NULL,
  full_name VARCHAR(190) NOT NULL,
  role ENUM('admin','dealer','customer') NOT NULL DEFAULT 'customer',
  status ENUM('active','passive','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_auth_subject (auth_provider, auth_subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  legal_name VARCHAR(190) NULL,
  tax_number VARCHAR(32) NULL,
  status ENUM('active','passive','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_stores_owner (owner_user_id),
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(100) NULL,
  barcode VARCHAR(100) NULL,
  name VARCHAR(255) NOT NULL,
  description MEDIUMTEXT NULL,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  status ENUM('active','passive','archived') NOT NULL DEFAULT 'active',
  source_type VARCHAR(40) NOT NULL DEFAULT 'manual',
  source_product_id VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_store (store_id),
  KEY idx_products_barcode (barcode),
  KEY idx_products_sku (store_id, sku),
  CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xml_feeds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  feed_url TEXT NOT NULL,
  status ENUM('active','paused','error') NOT NULL DEFAULT 'active',
  last_import_at DATETIME NULL,
  last_error VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_xml_feeds_store (store_id),
  CONSTRAINT fk_xml_feeds_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketplace_connections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  marketplace VARCHAR(50) NOT NULL,
  seller_reference VARCHAR(190) NULL,
  credentials_encrypted MEDIUMTEXT NULL,
  status ENUM('pending','active','error','disabled') NOT NULL DEFAULT 'pending',
  last_sync_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_store_marketplace (store_id, marketplace),
  CONSTRAINT fk_marketplace_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  marketplace_connection_id BIGINT UNSIGNED NULL,
  external_order_id VARCHAR(190) NULL,
  order_status VARCHAR(50) NOT NULL DEFAULT 'new',
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  ordered_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_marketplace_order (marketplace_connection_id, external_order_id),
  KEY idx_orders_store_date (store_id, ordered_at),
  CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_orders_marketplace FOREIGN KEY (marketplace_connection_id) REFERENCES marketplace_connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  external_product_id VARCHAR(190) NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
