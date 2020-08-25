const Order = require('./model/order.js');
const Product = require('./model/product.js');
const OrderItem = require('./model/orderitem.js');
const database = require('./model/database.js');
let User = require('./model/user.js');
const InventoryRecord = require('./model/inventoryRecord.js');

database.connect();

Order.collection.drop();
Product.collection.drop();
OrderItem.collection.drop();
InventoryRecord.collection.drop();