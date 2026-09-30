/**
 * Generates a unique-looking order number.
 * Format: SSM-YYYYMMDD-XXXXXX
 */
const generateOrderNumber = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `SSM-${datePart}-${randomPart}`;
};

module.exports = generateOrderNumber;
