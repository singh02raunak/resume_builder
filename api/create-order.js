export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { plan, userId, userEmail } = req.body
  const amounts = { starter: 1, pro: 2 } // ₹1 and ₹2 for testing

  if (!amounts[plan]) return res.status(400).json({ error: 'Invalid plan' })

  const isSandbox = process.env.CASHFREE_ENV !== 'production'
  const baseUrl = isSandbox
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg'

  const orderId = `order_${plan}_${Date.now()}`

  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amounts[plan],
        order_currency: 'INR',
        customer_details: {
          customer_id: userId || 'guest',
          customer_email: userEmail || 'test@example.com',
          customer_phone: '9999999999',
        },
      }),
    })

    const order = await response.json()
    if (!response.ok) throw new Error(order.message || 'Order creation failed')

    res.status(200).json({
      orderId: order.order_id,
      paymentSessionId: order.payment_session_id,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
