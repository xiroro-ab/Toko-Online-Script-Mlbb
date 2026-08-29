export default async function handler(req, res) {
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    await fetch("https://script.google.com/macros/s/AKfycbyfBzWmShFfm00QdleoSpxhgwPeRmwhu-OSte6JZcuza1G9sIfmlXgdeSjV1BLgsqoj/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, e: String(e) });
  }
}