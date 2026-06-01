import React, { useState } from 'react'
import './Transfer.css'

export default function Transfer({ userToken, onClose }) {
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userToken) {
      setMessage('Please connect wallet / login first')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('http://localhost:8000/api/stellar/testnet/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination, amount }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Transfer successful: ' + (data.transaction?.hash || 'ok'))
      } else {
        setMessage('Transfer failed: ' + (data.detail || JSON.stringify(data)))
      }
    } catch (err) {
      setMessage('Transfer error: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>Send XLM (Testnet)</h3>
        <form onSubmit={handleSubmit} className="transfer-form">
          <label>Destination</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="G..." />
          <label>Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button type="submit" disabled={loading || !destination}>{loading ? 'Sending...' : 'Send'}</button>
        </form>
        {message && <div className="transfer-message">{message}</div>}
      </div>
    </div>
  )
}
