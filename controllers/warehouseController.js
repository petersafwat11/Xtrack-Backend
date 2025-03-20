
const handlers = require("./handelerFactory");
exports.createWarehouse = handlers.createOne("dba.warehouse_master");
exports.getWarehouse = handlers.getOne("dba.warehouse_master", "warehouse_code");
exports.deleteWarehouse = handlers.deleteOne("dba.warehouse_master", "warehouse_code");
exports.updateWarehouse = handlers.updateOne("dba.warehouse_master", "warehouse_code");
exports.getAllWarehouses = handlers.getAll("dba.warehouse_master");