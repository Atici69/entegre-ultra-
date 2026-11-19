-- Entegre Ultra operational expansion. Apply after 001_core_schema.sql.
ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER auth_subject,
  ADD COLUMN dealer_parent_user_id BIGINT UNSIGNED NULL AFTER role,
  ADD KEY idx_users_dealer_parent (dealer_parent_user_id),
  ADD CONSTRAINT fk_users_dealer_parent FOREIGN KEY (dealer_parent_user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_sku VARCHAR(100) NULL,
  barcode VARCHAR(100) NULL,
  attributes JSON NULL,
  sale_price DECIMAL(12,2) NULL,
  stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_variants_product (product_id),
  KEY idx_variants_barcode (barcode),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  movement_type ENUM('in','out','adjustment','reservation','release') NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id VARCHAR(190) NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stock_store_date (store_id, created_at),
  KEY idx_stock_product (product_id),
  CONSTRAINT fk_stock_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_stock_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dealer_commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dealer_user_id BIGINT UNSIGNED NOT NULL,
  customer_user_id BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  status ENUM('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_commissions_dealer_status (dealer_user_id, status),
  CONSTRAINT fk_commissions_dealer FOREIGN KEY (dealer_user_id) REFERENCES users(id),
  CONSTRAINT fk_commissions_customer FOREIGN KEY (customer_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  product_limit INT UNSIGNED NOT NULL DEFAULT 100,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  billing_period ENUM('month','year') NOT NULL DEFAULT 'month',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_subscription_plan_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  store_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  status ENUM('trial','active','past_due','cancelled','expired') NOT NULL DEFAULT 'trial',
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  external_payment_reference VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_subscriptions_user_status (user_id, status),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_subscriptions_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  transaction_type ENUM('income','expense','commission','shipping','advertising','refund','payout') NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  transaction_date DATETIME NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  external_reference VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_financial_store_date (store_id, transaction_date),
  CONSTRAINT fk_financial_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_financial_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS buybox_observations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  marketplace VARCHAR(50) NOT NULL,
  observed_price DECIMAL(12,2) NULL,
  seller_reference VARCHAR(190) NULL,
  is_winner TINYINT(1) NULL,
  observed_at DATETIME NOT NULL,
  KEY idx_buybox_product_date (store_id, product_id, observed_at),
  CONSTRAINT fk_buybox_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_buybox_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketplace_sync_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  marketplace_connection_id BIGINT UNSIGNED NULL,
  job_type VARCHAR(50) NOT NULL,
  status ENUM('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  payload JSON NULL,
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  scheduled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sync_queue (status, scheduled_at),
  KEY idx_sync_store (store_id, created_at),
  CONSTRAINT fk_sync_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_sync_connection FOREIGN KEY (marketplace_connection_id) REFERENCES marketplace_connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS advertisements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  image_url TEXT NULL,
  target_url TEXT NULL,
  placement VARCHAR(80) NOT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  status ENUM('draft','active','paused','ended') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ads_placement_status (placement, status),
  CONSTRAINT fk_ads_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS e_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  provider VARCHAR(80) NOT NULL,
  document_type ENUM('e_invoice','e_archive') NOT NULL,
  document_number VARCHAR(100) NULL,
  status ENUM('queued','sent','accepted','rejected','cancelled','failed') NOT NULL DEFAULT 'queued',
  provider_reference VARCHAR(190) NULL,
  response_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_store_date (store_id, created_at),
  CONSTRAINT fk_invoice_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_invoice_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  store_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(190) NULL,
  ip_address VARCHAR(45) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_store_date (store_id, created_at),
  KEY idx_audit_user_date (user_id, created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_audit_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO subscription_plans (code, name, product_limit, price, billing_period)
VALUES ('starter', 'Başlangıç', 100, 0, 'month'),
       ('premium', 'Premium', 200000, 0, 'month');
