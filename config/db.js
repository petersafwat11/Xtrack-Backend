const dotenv = require("dotenv");
dotenv.config();

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },
  // debug: true,
  pool: {
    min: 2,
    max: 90,
  },
});

// Function to list all tables in the database
// const listTables = async () => {
//   try {
//     const tables = await knex
//       .select("table_name")
//       .from("information_schema.tables")
//       .where("table_schema", "dba");

//     console.log("\nDatabase Tables:");
//     console.log("----------------");
//     tables.forEach((table) => {
//       console.log(`- ${table.table_name}`);
//     });

//     // Optional: Get detailed information about each table
//     for (const table of tables) {
//       const columns = await knex
//         .select("column_name", "data_type", "is_nullable")
//         .from("information_schema.columns")
//         .where({
//           table_schema: "dba",
//           table_name: table.table_name,
//         });

//       console.log(`\nTable: ${table.table_name}`);
//       console.log("Columns:");
//       columns.forEach((column) => {
//         console.log(
//           `  - ${column.column_name} (${column.data_type}) ${column.is_nullable === "YES" ? "NULL" : "NOT NULL"}`
//         );
//       });
//     }
//   } catch (error) {
//     console.error("Error listing tables:", error);
//   }
// };

// // Test connection and list tables
// knex
//   .raw("SELECT 1")
//   .then(async () => {
//     console.log("Connected to the database successfully");
//     await listTables();
//   })
//   .catch((err) => {
//     console.error("Database connection failed:", err);
//   });

// Function to get and log all records from xtrack_log
const getLogRecords = async () => {
  try {
    const logs = await knex
      .select('*')
      .from('dba.xtrack_log');

    console.log('\nXtrack Log Records:');
    console.log('------------------');
    logs.forEach(log => {
      console.log(`User ID: ${log.user_id}`);
      console.log(`API Date: ${log.api_date}`);
      console.log(`API Request: ${log.api_request}`);
      console.log(`API Status: ${log.api_status}`);
      console.log(`IP Config: ${log.ip_config}`);
      console.log(`IP Location: ${log.ip_location}`);
      console.log('------------------');
    });
  } catch (error) {
    console.error('Error retrieving log records:', error);
  }
};

// Execute the function
// getLogRecords();

module.exports = knex;
