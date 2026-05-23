export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { orderId } = req.body
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' })

  const isSandbox = process.env.CASHFREE_ENV !== 'production'
  const baseUrl = isSandbox
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg'

  try {
    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    })

    const order = await response.json()
    if (!response.ok) throw new Error(order.message || 'Verification failed')

    res.status(200).json({
      verified: order.order_status === 'PAID',
      status: order.order_status,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
