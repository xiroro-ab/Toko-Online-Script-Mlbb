export default async function handler(req, res) {
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    await fetch("https://script.google.com/macros/s/AKfycbyPty75oBpOL07t9E6PYcNAm43Zu52Ul9DLnnOuC8YS41s8MdfIIKg2xvMYhJm9eSly/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, e: String(e) });
  }
}