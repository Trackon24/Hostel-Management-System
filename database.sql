CREATE DATABASE IF NOT EXISTS hostel_db;
USE hostel_db;

-- ============================================
-- Drop existing tables (order matters for FKs)
-- ============================================
DROP TABLE IF EXISTS room_applications;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS allocations;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS hostel_blocks;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS users;

-- Drop Views to avoid conflicts on re-running
DROP VIEW IF EXISTS student_room_details;
DROP VIEW IF EXISTS pending_complaints_view;
DROP VIEW IF EXISTS fee_status_report;

-- Drop Procedures to avoid conflicts
DROP PROCEDURE IF EXISTS allocate_room;
DROP PROCEDURE IF EXISTS add_complaint;
DROP PROCEDURE IF EXISTS pay_fee;

-- ============================================
-- Users table (with CGPA)
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'warden', 'student') NOT NULL DEFAULT 'student',
  cgpa DECIMAL(4,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Hostel Blocks table
-- ============================================
CREATE TABLE hostel_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  total_rooms INT NOT NULL DEFAULT 0,
  cgpa_threshold DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Rooms table (linked to blocks)
-- ============================================
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  block_id INT,
  floor INT NOT NULL DEFAULT 1,
  type ENUM('single', 'double', 'triple') NOT NULL DEFAULT 'double',
  capacity INT NOT NULL DEFAULT 2,
  status ENUM('available', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (block_id) REFERENCES hostel_blocks(id) ON DELETE SET NULL
);

-- ============================================
-- Allocations table (student → room mapping)
-- ============================================
CREATE TABLE allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_id INT NOT NULL,
  block_id INT,
  check_in DATE NOT NULL,
  check_out DATE,
  status ENUM('active', 'checked_out') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (block_id) REFERENCES hostel_blocks(id) ON DELETE SET NULL
);

-- ============================================
-- Room Applications table
-- ============================================
CREATE TABLE room_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  room_type ENUM('single', 'double') NOT NULL DEFAULT 'single',
  preferred_block_id INT,
  partner_id INT DEFAULT NULL,
  status ENUM('pending', 'allocated', 'rejected') NOT NULL DEFAULT 'pending',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (preferred_block_id) REFERENCES hostel_blocks(id) ON DELETE SET NULL,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Complaints table
-- ============================================
CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Fees table
-- ============================================
CREATE TABLE fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  description VARCHAR(200) NOT NULL DEFAULT 'Hostel Fee',
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Announcements table
-- ============================================
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  posted_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);
-- ============================================
-- Audit Logs table
-- ============================================
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_type VARCHAR(50),
  table_name VARCHAR(50),
  record_id INT,
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performed_by VARCHAR(100)
);

-- ============================================
-- Constraints
-- ============================================
ALTER TABLE fees
ADD CONSTRAINT chk_fee_amount CHECK (amount > 0);

ALTER TABLE rooms
ADD CONSTRAINT chk_room_capacity CHECK (capacity > 0);

ALTER TABLE allocations
ADD CONSTRAINT chk_dates CHECK (check_out IS NULL OR check_out >= check_in);

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- Allocate a room
CREATE PROCEDURE allocate_room(
    IN p_student_id INT,
    IN p_room_id INT,
    IN p_check_in DATE
)
BEGIN
    INSERT INTO allocations (student_id, room_id, check_in, status)
    VALUES (p_student_id, p_room_id, p_check_in, 'active');
END //

-- Add complaint
CREATE PROCEDURE add_complaint(
    IN p_student_id INT,
    IN p_title VARCHAR(200),
    IN p_description TEXT
)
BEGIN
    INSERT INTO complaints (student_id, title, description, status)
    VALUES (p_student_id, p_title, p_description, 'pending');
END //

-- Pay fee
CREATE PROCEDURE pay_fee(
    IN p_fee_id INT,
    IN p_paid_date DATE
)
BEGIN
    UPDATE fees
    SET status = 'paid',
        paid_date = p_paid_date
    WHERE id = p_fee_id;
END //

DELIMITER ;

-- ============================================
-- Triggers
-- ============================================

DELIMITER //

-- Automatically mark overdue fees before insert
CREATE TRIGGER before_fee_insert
BEFORE INSERT ON fees
FOR EACH ROW
BEGIN
    IF NEW.due_date < CURDATE() AND NEW.status = 'pending' THEN
        SET NEW.status = 'overdue';
    END IF;
END //

-- Set resolved_at when a complaint is resolved
CREATE TRIGGER before_complaint_update
BEFORE UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
        SET NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
END //

-- Prevent room over-allocation
CREATE TRIGGER before_allocation_insert
BEFORE INSERT ON allocations
FOR EACH ROW
BEGIN
    DECLARE current_count INT;
    DECLARE room_cap INT;

    SELECT COUNT(*) INTO current_count
    FROM allocations
    WHERE room_id = NEW.room_id AND status = 'active';

    SELECT capacity INTO room_cap
    FROM rooms
    WHERE id = NEW.room_id;

    IF current_count >= room_cap THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Room is already full';
    END IF;
END //

-- Audit log after complaint update
CREATE TRIGGER after_complaint_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, performed_by)
    VALUES ('UPDATE', 'complaints', NEW.id, 'system');
END //

DELIMITER ;

-- ============================================
-- Views
-- ============================================

CREATE VIEW student_room_details AS
SELECT 
    u.id AS student_id,
    u.name AS student_name,
    u.email,
    r.room_number,
    r.floor,
    r.type,
    a.check_in,
    a.status
FROM users u
JOIN allocations a ON u.id = a.student_id
JOIN rooms r ON a.room_id = r.id
WHERE u.role = 'student' AND a.status = 'active';

CREATE VIEW pending_complaints_view AS
SELECT 
    c.id,
    u.name AS student_name,
    c.title,
    c.description,
    c.status,
    c.created_at
FROM complaints c
JOIN users u ON c.student_id = u.id
WHERE c.status <> 'resolved';

CREATE VIEW fee_status_report AS
SELECT 
    u.name AS student_name,
    u.email,
    f.description,
    f.amount,
    f.due_date,
    f.paid_date,
    f.status
FROM fees f
JOIN users u ON f.student_id = u.id;

-- ============================================
-- Seed data
-- ============================================

-- Default admin (password: admin123)
INSERT INTO users (name, email, phone, password, role, cgpa) VALUES
('Admin', 'admin@hostel.com', '9876543210', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9pB.KjGk0V1kOY3FqE3ug6hKXe', 'admin', NULL),
('Warden Kumar', 'warden@hostel.com', '9876543211', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9pB.KjGk0V1kOY3FqE3ug6hKXe', 'warden', NULL),
('Rahul Sharma', 'rahul@hostel.com', '9876543212', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9pB.KjGk0V1kOY3FqE3ug6hKXe', 'student', 8.50),
('Priya Patel', 'priya@hostel.com', '9876543213', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9pB.KjGk0V1kOY3FqE3ug6hKXe', 'student', 9.20),
('Amit Kumar', 'amit@hostel.com', '9876543214', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9pB.KjGk0V1kOY3FqE3ug6hKXe', 'student', 7.80),
('Sneha Reddy', 'sneha@hostel.com', '9876543215', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9pB.KjGk0V1kOY3FqE3ug6hKXe', 'student', 6.50);

-- Sample hostel blocks
INSERT INTO hostel_blocks (name, description, total_rooms, cgpa_threshold, status) VALUES
('Block A', 'Premium block with AC rooms and attached washrooms. Near the main library.', 20, 8.00, 'active'),
('Block B', 'Standard block with shared facilities. Close to the mess and sports ground.', 30, 6.50, 'active'),
('Block C', 'Economy block with basic amenities. Located near the main gate.', 25, 5.00, 'active'),
('Block D', 'New block under renovation. Will open next semester.', 15, 7.00, 'inactive');

-- Sample rooms (linked to blocks)
INSERT INTO rooms (room_number, block_id, floor, type, capacity, status) VALUES
('A101', 1, 1, 'single', 1, 'available'),
('A102', 1, 1, 'double', 2, 'available'),
('A103', 1, 1, 'double', 2, 'available'),
('A201', 1, 2, 'single', 1, 'available'),
('A202', 1, 2, 'double', 2, 'available'),
('B101', 2, 1, 'double', 2, 'available'),
('B102', 2, 1, 'double', 2, 'available'),
('B103', 2, 1, 'triple', 3, 'available'),
('B201', 2, 2, 'double', 2, 'available'),
('B202', 2, 2, 'single', 1, 'maintenance'),
('C101', 3, 1, 'double', 2, 'available'),
('C102', 3, 1, 'double', 2, 'available'),
('C103', 3, 1, 'triple', 3, 'available'),
('C201', 3, 2, 'single', 1, 'available'),
('C202', 3, 2, 'double', 2, 'available');

-- Sample allocations
INSERT INTO allocations (student_id, room_id, block_id, check_in, status) VALUES
(3, 2, 1, '2026-01-15', 'active'),
(4, 3, 1, '2026-01-15', 'active');

-- Sample room applications
INSERT INTO room_applications (student_id, room_type, preferred_block_id, partner_id, status) VALUES
(5, 'double', 2, 6, 'pending'),
(6, 'double', 2, 5, 'pending');

-- Sample complaints
INSERT INTO complaints (student_id, title, description, status) VALUES
(3, 'Water Leakage', 'There is water leaking from the bathroom ceiling in room A102.', 'pending'),
(4, 'Broken Fan', 'The ceiling fan in room A103 is not working properly.', 'in_progress'),
(3, 'Wi-Fi Issue', 'Wi-Fi connectivity is very poor on the 1st floor of Block A.', 'resolved');

-- Sample fees
INSERT INTO fees (student_id, description, amount, due_date, status) VALUES
(3, 'Hostel Fee - Semester 4', 45000.00, '2026-04-01', 'pending'),
(4, 'Hostel Fee - Semester 4', 45000.00, '2026-04-01', 'pending'),
(3, 'Hostel Fee - Semester 3', 45000.00, '2025-10-01', 'paid'),
(5, 'Hostel Fee - Semester 4', 45000.00, '2026-04-01', 'pending'),
(6, 'Hostel Fee - Semester 4', 45000.00, '2026-04-01', 'pending');

-- Sample announcements
INSERT INTO announcements (title, content, priority, posted_by) VALUES
('Hostel Maintenance Notice', 'The water supply will be interrupted on March 28th from 10 AM to 2 PM for maintenance work.', 'high', 1),
('Block A Room Allocation Open', 'Room allocation for Block A is now open for students with CGPA 8.0 and above. Apply before April 5th.', 'high', 1),
('Cultural Fest Registration', 'Registration for the annual cultural fest is now open. Contact the warden for more details.', 'medium', 2),
('New Mess Menu', 'The updated mess menu for April has been posted on the notice board.', 'low', 2);
