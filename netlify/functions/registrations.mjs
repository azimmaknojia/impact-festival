import { getStore } from "@netlify/blobs";

// Private admin endpoint to list/export stored registrations.
// Requires ?token=<REG_ADMIN_TOKEN>. Optional &format=csv.
export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const admin = process.env.REG_ADMIN_TOKEN;

  if (!admin || token !== admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const store = getStore("registrations");

  // Delete one entry: DELETE (or GET with &delete=) ?key=<key>
  const delKey = url.searchParams.get("delete") || (req.method === "DELETE" ? url.searchParams.get("key") : null);
  if (delKey) {
    await store.delete(delKey);
    return new Response(JSON.stringify({ ok: true, deleted: delKey }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const { blobs } = await store.list();
  const out = [];
  for (const b of blobs) {
    const rec = await store.get(b.key, { type: "json" });
    if (rec) out.push({ key: b.key, ...rec });
  }
  out.sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1));

  if (url.searchParams.get("format") === "csv") {
    const cols = [
      "submitted_at", "name", "phone", "email", "city", "country_of_origin",
      "needs_visa", "group_size", "group_size_exact", "ancestral_village",
      "ancestral_village_other", "party_members", "notes",
    ];
    const esc = (s) => '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"';
    const rows = [cols.join(",")].concat(
      out.map((r) => cols.map((c) => esc(r[c])).join(","))
    );
    return new Response(rows.join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=impact-registrations.csv",
      },
    });
  }

  return new Response(JSON.stringify({ count: out.length, registrations: out }, null, 2), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
