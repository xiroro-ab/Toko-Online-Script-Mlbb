export default async function handler(req, res) {
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    await fetch("https://script.google.com/macros/s/AKfycbxq3gpDXDYWj3-H6eAHfG95gHd5eEgaf34rg98Ky1TjpvFvMF2b99_1g1LGbkKlzLGS/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, e: String(e) });
  }
}