import React, { useState, useEffect } from 'react'
import ThreeScene from './ThreeScene'
import Leaderboard from './Leaderboard'
import Engagement from './Engagement'
import Referral from './Referral'
import Transfer from './Transfer'

function truncateAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatDuration(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

const CLAIM_KEY = 'starclaim-last-claim-timestamp'
const COOLDOWN_MS = 24 * 60 * 60 * 1000

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletError, setWalletError] = useState(null)
  const [tokenBalance, setTokenBalance] = useState(28.2)
  const [claimStatus, setClaimStatus] = useState('idle')
  const [claimMessage, setClaimMessage] = useState('')
  const [lastClaimAt, setLastClaimAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [activeModal, setActiveModal] = useState(null)
  const [showTransfer, setShowTransfer] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(CLAIM_KEY)
    const timestamp = stored ? Number(stored) : null
    if (timestamp && !Number.isNaN(timestamp)) {
      setLastClaimAt(timestamp)
      setTimeLeft(Math.max(COOLDOWN_MS - (Date.now() - timestamp), 0))
    }
  }, [])

  useEffect(() => {
    if (!lastClaimAt) return
    const interval = window.setInterval(() => {
      const remaining = Math.max(COOLDOWN_MS - (Date.now() - lastClaimAt), 0)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setLastClaimAt(null)
        window.localStorage.removeItem(CLAIM_KEY)
        window.clearInterval(interval)
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [lastClaimAt])

  const connectWallet = async () => {
    setWalletError(null)

    try {
      const { default: FreighterApi } = await import('@stellar/freighter-api')
      const freighter = new FreighterApi()
      const publicKey = await freighter.connect()
      if (!publicKey) {
        throw new Error('Freighter connection failed')
      }

      const balance = await freighter.getBalance()
      setWalletAddress(publicKey)
      setWalletBalance(balance || '0')
    } catch (error) {
      console.error(error)
      setWalletError(error?.message || 'Unable to connect wallet')
    }
  }

  const canClaim = timeLeft <= 0 && claimStatus !== 'pending'

  const handleClaim = async () => {
    if (!canClaim) return
    setClaimStatus('pending')
    setClaimMessage('Pending...')

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setTokenBalance((prev) => prev + 1)

    const now = Date.now()
    setLastClaimAt(now)
    window.localStorage.setItem(CLAIM_KEY, String(now))
    setTimeLeft(COOLDOWN_MS)

    setClaimStatus('success')
    setClaimMessage('Success!')

    setTimeout(() => {
      setClaimStatus('idle')
      setClaimMessage('')
    }, 2600)
  }

  return (
    <div className="app">
      <div className="top-bar">
        <div className="brand">STARCLAIM</div>
        <div className="wallet-panel">
          {walletAddress ? (
            <>
              <button className="wallet-button connected" onClick={connectWallet}>
                Connected
              </button>
              <div className="wallet-summary connected-text">
                Connected: {truncateAddress(walletAddress)}
              </div>
              <div className="wallet-summary">
                <span className="wallet-label">XLM</span>
                <span className="wallet-value">{walletBalance ?? '0.00'}</span>
              </div>
            </>
          ) : (
            <button className="wallet-button" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <ThreeScene onClaim={handleClaim} claimStatus={claimStatus} disabled={!canClaim} />

      <div className="hud left">
        <div className="panel">
          <div className="panel-title">STAR BALANCE</div>
          <div className="panel-value">{tokenBalance.toFixed(2)} STAR</div>
          {claimStatus !== 'idle' && (
            <div className={`claim-status ${claimStatus}`}>{claimMessage}</div>
          )}
          {timeLeft > 0 ? (
            <div className="cooldown-text">Next claim in {formatDuration(timeLeft)}</div>
          ) : (
            <div className="cooldown-text ready">Claim ready</div>
          )}
        </div>
      </div>

      <div className="hud right">
        <div className="panel">
          <div className="panel-title">VAULT</div>
          <div className="panel-value">3 items</div>
        </div>
      </div>

      <div className="floating-wheel">
        <button onClick={() => setActiveModal('engagement')}>⭐ Daily</button>
        <button onClick={() => setActiveModal('referral')}>👥 Refer</button>
        <button onClick={() => setActiveModal('leaderboard')}>🏆 Rank</button>
        <button onClick={connectWallet}>💼 Wallet</button>
        <button onClick={() => setShowTransfer(true)}>💸 Transfer</button>
      </div>

      {activeModal === 'leaderboard' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
            <Leaderboard />
          </div>
        </div>
      )}

      {activeModal === 'engagement' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content engagement-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
            <Engagement userToken={walletAddress} />
          </div>
        </div>
      )}

      {activeModal === 'referral' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content referral-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
            <Referral userToken={walletAddress} />
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTransfer(false)}>✕</button>
            <Transfer userToken={walletAddress} onClose={() => setShowTransfer(false)} />
          </div>
        </div>
      )}

      {walletError && <div className="error-toast">{walletError}</div>}
    </div>
  )
}
