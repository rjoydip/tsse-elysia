#!/usr/bin/env bun

import { encodePassword } from "~/lib/utils/encryption";

const db = require("bun:sqlite").Database.open(".artifacts/tsse-elysia.db");

// Fix admin
const adminPassword = await encodePassword("admin123");
db.query("DELETE FROM account WHERE userId = (SELECT id FROM user WHERE email = ?)").run(
  "admin@tsse.local",
);
db.query("DELETE FROM user WHERE email = ?").run("admin@tsse.local");

const adminSignup = await fetch("http://localhost:3000/api/auth/sign-up/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@tsse.local", password: adminPassword, name: "Super Admin" }),
});
console.log("Admin signup:", adminSignup.status);
db.query("UPDATE user SET role = ? WHERE email = ?").run("superadmin", "admin@tsse.local");

// Fix manager
const managerPassword = await encodePassword("manager123");
db.query("DELETE FROM account WHERE userId = (SELECT id FROM user WHERE email = ?)").run(
  "manager@tsse.local",
);
db.query("DELETE FROM user WHERE email = ?").run("manager@tsse.local");

const managerSignup = await fetch("http://localhost:3000/api/auth/sign-up/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "manager@tsse.local",
    password: managerPassword,
    name: "Test Manager",
  }),
});
console.log("Manager signup:", managerSignup.status);
db.query("UPDATE user SET role = ? WHERE email = ?").run("manager", "manager@tsse.local");

console.log("\nFixed admin and manager users!");
console.log("Admin login: admin@tsse.local / admin123");
console.log("Manager login: manager@tsse.local / manager123");