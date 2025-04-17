const db = require("../config/db"); // Knex connection

const Endpoint = {
  // Main table name
  tableName: "dba.xtrack_endpoint",
  findAll: async () => {
    return await db(Endpoint.tableName).orderBy("update_date", "desc");
  },

  findByMenuId: async (menuId) => {
    return await db(Endpoint.tableName).where({ menu_id: menuId }).first();
  },
  create: async (endpointData) => {
    const dataWithTimestamp = {
      ...endpointData,
      update_date: db.fn.now(),
    };

    const [newEndpoint] = await db(Endpoint.tableName)
      .insert(dataWithTimestamp)
      .returning("*");

    return newEndpoint;
  },

  update: async (criteria, updatedData) => {
    const { old_menu_id, old_endpoint } = criteria;

    const dataWithTimestamp = {
      ...updatedData,
      update_date: db.fn.now(),
    };

    const [updated] = await db(Endpoint.tableName)
      .where({
        menu_id: old_menu_id,
        endpoint: old_endpoint,
      })
      .update(dataWithTimestamp)
      .returning("*");

    return updated;
  },

  delete: async (menuId, endpoint) => {
    await db(Endpoint.tableName)
      .where({
        menu_id: menuId,
        endpoint: endpoint,
      })
      .del();
    return true;
  },
};

module.exports = Endpoint;
