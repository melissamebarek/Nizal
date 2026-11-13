CREATE DATABASE IF NOT EXISTS nizal CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nizal;

-- ============================================
-- ARTICLES
-- ============================================
CREATE TABLE
    articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        cover_image LONGTEXT,
        content LONGTEXT NOT NULL,
        status ENUM ('draft', 'published') DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        published_at DATETIME NULL
    );

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE
    products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE
    product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url LONGTEXT NOT NULL,
        is_main BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

CREATE TABLE
    product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color VARCHAR(100),
        size VARCHAR(50),
        stock INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

-- ============================================
-- COMPETITIONS
-- ============================================
CREATE TABLE
    competitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sport VARCHAR(100) NOT NULL,
        discipline VARCHAR(100),
        location VARCHAR(255),
        city VARCHAR(100),
        start_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        organizer VARCHAR(255),
        cover_image longtext,
        opening_date DATE,
        closing_date DATE,
        registration_fee DECIMAL(10, 2) DEFAULT 0,
        max_participants INT,
        eligibility TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE
    competition_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        competition_id INT NOT NULL,
        sport VARCHAR(100) NOT NULL,
        discipline VARCHAR(100),
        gender VARCHAR(50),
        age_category VARCHAR(100),
        weight_category VARCHAR(100),
        CONSTRAINT fk_competition_categories_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE
    );

CREATE TABLE
    competition_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        competition_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_required BOOLEAN DEFAULT TRUE,
        accepted_formats VARCHAR(255),
        max_file_size INT,
        CONSTRAINT fk_competition_documents_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE
    );

-- ============================================
-- REGISTRATIONS
-- ============================================
CREATE TABLE
    registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_number VARCHAR(50) NOT NULL UNIQUE,
        competition_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        date_of_birth DATE,
        gender VARCHAR(50),
        sport VARCHAR(100),
        discipline VARCHAR(100),
        age_category VARCHAR(100),
        weight_category VARCHAR(100),
        status ENUM (
            'submitted',
            'under_review',
            'accepted',
            'rejected',
            'cancelled'
        ) DEFAULT 'submitted',
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_registrations_competition FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE
    );

CREATE TABLE
    registration_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL,
        competition_document_id INT NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        status ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending',
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_registration_documents_registration FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE CASCADE,
        CONSTRAINT fk_registration_documents_competition_document FOREIGN KEY (competition_document_id) REFERENCES competition_documents (id) ON DELETE CASCADE
    );

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE
    orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        shipping_address TEXT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM (
            'new',
            'preparing',
            'shipped',
            'delivered',
            'cancelled'
        ) DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE
    order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        variant_color VARCHAR(100),
        variant_size VARCHAR(50),
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );

ALTER TABLE orders
ADD COLUMN customer_email VARCHAR(255) NULL,
ADD COLUMN wilaya_code VARCHAR(10) NULL,
ADD COLUMN wilaya_name VARCHAR(100) NULL,
ADD COLUMN city VARCHAR(150) NULL,
ADD COLUMN delivery_type ENUM ('bureau', 'domicile') NULL,
ADD COLUMN delivery_notes TEXT NULL,
ADD COLUMN shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery';

ALTER TABLE order_items
ADD COLUMN variant_id INT NULL,
ADD COLUMN original_unit_price DECIMAL(10, 2) NULL,
ADD COLUMN unit_discount DECIMAL(10, 2) NOT NULL DEFAULT 0;

USE nizal;

-- Run this migration once against the existing NIZAL database.
-- The original registrations table does not store these fields yet.
ALTER TABLE registrations
ADD COLUMN email VARCHAR(255) NULL AFTER phone,
ADD COLUMN club_name VARCHAR(255) NULL AFTER gender,
ADD COLUMN experience_level VARCHAR(100) NULL AFTER coach_name,
ADD COLUMN competition_category_id INT NULL AFTER competition_id,
ADD COLUMN registration_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER weight_category;

ALTER TABLE registrations ADD CONSTRAINT fk_registrations_category FOREIGN KEY (competition_category_id) REFERENCES competition_categories (id) ON DELETE SET NULL;

CREATE INDEX idx_registrations_email ON registrations (email);

CREATE INDEX idx_registrations_category ON registrations (competition_category_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_articles_status ON articles (status);

CREATE INDEX idx_articles_category ON articles (category);

CREATE INDEX idx_products_category ON products (category);

CREATE INDEX idx_product_variants_product ON product_variants (product_id);

CREATE INDEX idx_competitions_sport ON competitions (sport);

CREATE INDEX idx_competitions_start_date ON competitions (start_date);

CREATE INDEX idx_competition_categories_competition ON competition_categories (competition_id);

CREATE INDEX idx_competition_documents_competition ON competition_documents (competition_id);

CREATE INDEX idx_registrations_competition ON registrations (competition_id);

CREATE INDEX idx_registrations_status ON registrations (status);

CREATE INDEX idx_registration_documents_registration ON registration_documents (registration_id);

CREATE INDEX idx_orders_status ON orders (status);

CREATE INDEX idx_orders_created_at ON orders (created_at);

CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE INDEX idx_order_items_product ON order_items (product_id);

ALTER TABLE registrations
ADD COLUMN additional_info_request TEXT NULL;

CREATE TABLE
    IF NOT EXISTS registration_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL,
        old_status VARCHAR(50) NULL,
        new_status VARCHAR(50) NOT NULL,
        comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_registration_history (registration_id),
        CONSTRAINT fk_registration_history_registration FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE CASCADE
    );