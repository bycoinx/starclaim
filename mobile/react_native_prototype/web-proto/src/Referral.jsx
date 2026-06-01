import React, { useState } from 'react'
import './Referral.css'

export default function Referral({ userToken, onReferralClaimed }) {
  const [referralCode, setReferralCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleClaimReferral = async () => {
    if (!referralCode || !userToken || loading) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/referral/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referral_code: referralCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ status: 'success', reward: data.reward })
        setReferralCode('')
        if (onReferralClaimed) onReferralClaimed()
      } else {
        setResult({ status: 'error', message: data.detail })
      }
    } catch (err) {
      setResult({ status: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="referral-panel">
      <div className="referral-title">REFERRAL BONUS</div>
      <div className="referral-content">
        <input
          type="text"
          placeholder="Enter referral code"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="referral-input"
        />
        <button
          onClick={handleClaimReferral}
          disabled={!referralCode || loading}
          className="referral-button"
        >
          {loading ? 'Loading...' : 'Claim'}
        </button>
      </div>
      {result && (
        <div className={`referral-result ${result.status}`}>
          {result.status === 'success' ? (
            <>✓ +{result.reward} Points</>
          ) : (
            <>✗ {result.message}</>
          )}
        </div>
      )}
    </div>
  )
}
