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
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000, 
    query_timeout: 10000, 
    statement_timeout: 10000, 
    idle_in_transaction_session_timeout: 10000 
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000, 
    createTimeoutMillis: 30000,  
    idleTimeoutMillis: 30000,    
    reapIntervalMillis: 1000,    
    createRetryIntervalMillis: 200, 
  },
  acquireConnectionTimeout: 60000, // 60 seconds
});

// Add event listeners for connection issues
knex.on('query-error', function(error, obj) {
  console.error('Query error:', error);
  console.error('Query that caused error:', obj);
});

knex.on('error', function(err) {
  console.error('Database error:', err);
});

// Function to list all tables in the database
const allowedTables = [
  // "xwms_users",
  // "wms_app_sorting", "wms_app_receive", "wms_app_putaway", "wms_app_transfer",
  // "wms_app_pick", "wms_app_pack", "wms_app_stock_take", "warehouse_master",
  // "wms_location", "wms_commodity", "partner", "xwms_signup",
  // "xwms_feedback", "xwms_log", "xwms_organization", "inventory_header",
   "inventory_detail"
];

const listTables = async () => {
  try {
    // List only allowed tables from schema "dba"
    const tables = await knex
      .select("table_name")
      .from("information_schema.tables")
      .where("table_schema", "dba")
      .whereIn("table_name", allowedTables); // ✅ Filter only the required tables

    console.log("\nDatabase Tables:");
    console.log("----------------");
    tables.forEach((table) => {
      console.log(`- ${table.table_name}`);
    });

    // Fetch column details only for allowed tables
    for (const table of tables) {
      const columns = await knex
        .select("column_name", "data_type", "is_nullable", "character_maximum_length")
        .from("information_schema.columns")
        .where({
          table_schema: "dba",
          table_name: table.table_name,
        });

      console.log(`\nTable: ${table.table_name}`);
      console.log("Columns:");
      columns.forEach((column) => {
        console.log(
          `  - ${column.column_name} (${column.data_type}${column.character_maximum_length ? `, max length: ${column.character_maximum_length}` : ""}) ${column.is_nullable === "YES" ? "NULL" : "NOT NULL"}`
        );
      });
    }
  } catch (error) {
    console.error("Error listing tables:", error);
  }
};

const listTablesWithPrimaryKeys = async () => {
  try {
    // Get table names from schema "dba" that are in allowedTables
    const tables = await knex
      .select("table_name")
      .from("information_schema.tables")
      .where("table_schema", "dba")
      .whereIn("table_name", allowedTables);

    console.log("Tables fetched:", tables.map(t => t.table_name));

    // Fetch primary keys for each table
    const primaryKeys = await knex.raw(`
      SELECT 
        c.table_name, 
        a.attname AS primary_key
      FROM 
        information_schema.tables c
      JOIN 
        pg_index i ON c.table_name::regclass = i.indrelid
      JOIN 
        pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE 
        c.table_schema = 'dba' 
        AND c.table_name IN (${allowedTables.map(t => `'${t}'`).join(", ")})
        AND i.indisprimary
    `);

    // Group primary keys by table
    const tablePrimaryKeys = primaryKeys.rows.reduce((acc, row) => {
      if (!acc[row.table_name]) {
        acc[row.table_name] = [];
      }
      acc[row.table_name].push(row.primary_key);
      return acc;
    }, {});

    console.log("\nTables with Primary Keys:");
    console.log("----------------------");
    Object.entries(tablePrimaryKeys).forEach(([table, keys]) => {
      console.log(`- ${table} (Primary Keys: ${keys.join(", ")})`);
    });

    return tablePrimaryKeys;
  } catch (error) {
    console.error("Error fetching tables and primary keys:", error);
    return {};
  }
};

knex
  .raw("SELECT 1")
  .then(async () => {
    console.log("Connected to the database successfully");
    // await listTablesWithPrimaryKeys();
    // await listTables();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
  
module.exports = knex;
 