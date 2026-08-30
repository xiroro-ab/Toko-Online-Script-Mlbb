export default async function handler(req, res) {
  try {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    await fetch("https://script.google.com/macros/s/AKfycbzB0UZRr5PDWnbY4gKkPSMlti17RKpaHx4zUYhdAaGOVt-8KZVu7pG5h0BWFIPrsjCs/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, e: String(e) });
  }
}