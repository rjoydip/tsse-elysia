import { handle } from "./src/routes/api/-app";

const request = new Request("http://localhost:3000/api/email/render", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    template: "welcome",
    data: { username: "Jane", dashboardUrl: "https://example.com/dashboard" },
  }),
});

console.log("Request URL:", request.url);
console.log("Request method:", request.method);

try {
  const res = await handle({ request });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
} catch (e) {
  console.error("Handle threw:", e);
}

// Also test with text() + JSON.parse() approach
const request2 = new Request("http://localhost:3000/api/email/render", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    template: "welcome",
    data: { username: "Jane", dashboardUrl: "https://example.com/dashboard" },
  }),
});

try {
  const text = await request2.text();
  console.log("\n--- Testing request.text() ---");
  console.log("Raw body text:", text);
  const parsed = JSON.parse(text);
  console.log("Parsed body:", JSON.stringify(parsed, null, 2));
} catch (e) {
  console.error("request.text() failed:", e);
}