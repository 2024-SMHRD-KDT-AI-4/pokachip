// C:\Users\smhrd\Desktop\pokachip\server\db.js

const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "project-db-cgi.smhrd.com",
  port: 3307,
  user: "cgi_24K_AI4_p3_2",
  password: "smhrd2",
  database: "cgi_24K_AI4_p3_2",
});

module.exports = db;
