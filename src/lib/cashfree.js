export function loadCashfreeScript() {
  return new Promise((resolve) => {
    if (window.Cashfree) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function openCashfreeCheckout({ paymentSessionId }) {
  const loaded = await loadCashfreeScript()
  if (!loaded) throw new Error('Cashfree SDK failed to load. Check your connection.')

  const mode = import.meta.env.VITE_CASHFREE_ENV || 'sandbox'
  const cashfree = window.Cashfree({ mode })

  return new Promise((resolve, reject) => {
    cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_modal',
    }).then((result) => {
      if (result.error) reject(new Error(result.error.message || 'Payment failed'))
      else if (result.paymentDetails) resolve(result.paymentDetails)
      else reject(new Error('cancelled'))
    })
  })
}
