export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function openRazorpayCheckout({ orderId, amount, currency, planKey, userEmail, userName }) {
  const loaded = await loadRazorpayScript()
  if (!loaded) throw new Error('Razorpay failed to load. Check your connection.')

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount,
      currency,
      name: 'ResumeAI',
      description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
      order_id: orderId,
      prefill: { name: userName || '', email: userEmail || '' },
      theme: { color: '#4F46E5' },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('cancelled')) },
    }
    new window.Razorpay(options).open()
  })
}
