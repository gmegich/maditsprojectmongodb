/**
 * Central export for all Mongoose models.
 * Requiring this file registers every schema with mongoose.
 */
const User = require('./User');
const Seller = require('./Seller');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');
const Payment = require('./Payment');
const Review = require('./Review');
const Message = require('./Message');
const Notification = require('./Notification');

module.exports = {
  User,
  Seller,
  Category,
  Product,
  Cart,
  Order,
  Payment,
  Review,
  Message,
  Notification,
};
