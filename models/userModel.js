const db = require("../config/db"); // Your db connection via Knex
// ss
const User = {
  findAll: async () => {
    return await db("dba.qru_access").select("*"); // Select all columns
  },

  // Find user by email
  findByEmail: async (email) => {
    return await db("dba.qru_access").where({ user_email: email }).first();
  },

  // Create a new user
  create: async (userData) => {
    const [newUser] = await db("dba.qru_access")
      .insert(userData)
      .returning(["id", "user_name", "user_email"]);
    return newUser;
  },

  // Update user by id
  update: async (id, updatedData) => {
    return await db("dba.qru_access")
      .where({ id })
      .update(updatedData)
      .returning(["id", "user_name", "user_email"]);
  },

  // Find user by id
  findById: async (id) => {
    return await db("dba.qru_access").where({ id }).first();
  },
};

module.exports = User;
