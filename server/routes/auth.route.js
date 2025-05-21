const express = require("express");
const router = express.Router();
const { loginSocial } = require("../controllers/auth.controller");
const { registerSocial } = require("../controllers/auth.controller");

router.post("/login", loginSocial);
router.post('/register', registerSocial);


module.exports = router;
