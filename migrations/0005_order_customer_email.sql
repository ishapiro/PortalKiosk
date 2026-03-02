-- Add customer_email to orders for notification emails
ALTER TABLE orders
ADD COLUMN customer_email TEXT;

