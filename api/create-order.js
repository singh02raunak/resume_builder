export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { plan } = req.body
  const amounts = { starter: 100, pro: 200 } // paise: ₹1 = 100, ₹2 = 200

  if (!amounts[plan]) return res.status(400).json({ error: 'Invalid plan' })

  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${key_id}:${key_secret}`),
      },
      body: JSON.stringify({
        amount: amounts[plan],
        currency: 'INR',
        receipt: `receipt_${plan}_${Date.now()}`,
        notes: { plan },
      }),
    })

    const order = await response.json()
    if (!response.ok) throw new Error(order.error?.description || 'Order creation failed')

    res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
