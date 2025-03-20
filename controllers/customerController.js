
const handlers = require("./handelerFactory");
const knex = require("../config/db");
exports.createCustomer = handlers.createOne("dba.partner");
exports.getCustomerCode = async (req, res) => {
  const { company, entity_code } = req.query;
  try {
    const customerCodes = await knex("dba.partner")
      .select("partner_code")
      .where({ company, entity_code });
      const codesArray = customerCodes.map(record => record.partner_code);

    res.status(200).json({
      status: "success",
      data: codesArray, // Returns an array of partner codes
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
exports.getCustomers = handlers.getAll("dba.partner");
exports.getCustomer = handlers.getOne("dba.partner", "partner_code");
exports.updateCustomer = handlers.updateOne("dba.partner", "partner_code");
exports.deleteCustomer = handlers.deleteOne("dba.partner", "partner_code");
