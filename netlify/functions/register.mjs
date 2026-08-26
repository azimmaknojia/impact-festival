import { getStore } from "@netlify/blobs";

// Receives a signup POST from the Impact Festival form and stores it.
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let data = {};
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      data = await req.json();
    } else {
      const form = await req.formData();
      for (const [k, v] of form.entries()) {
        data[k] = typeof v === "string" ? v : "(file)";
      }
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "bad request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Honeypot: silently accept bots without storing.
  if (data["bot-field"]) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  delete data["bot-field"];
  delete data["form-name"];

  if (!data.name || !data.phone) {
    return new Response(JSON.stringify({ ok: false, error: "name and phone required" }), {
      status: 422,
      headers: { "content-type": "application/json" },
    });
  }

  const submitted_at = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 8);
  const key = submitted_at.replace(/[:.]/g, "-") + "-" + rand;
  const record = {
    ...data,
    submitted_at,
    ip: req.headers.get("x-nf-client-connection-ip") || "",
  };

  try {
    const store = getStore("registrations");
    await store.setJSON(key, record);
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "storage failed: " + e.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
