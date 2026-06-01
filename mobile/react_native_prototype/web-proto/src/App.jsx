import React, { useState } from 'react'
import ThreeScene from './ThreeScene'

function truncateAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletError, setWalletError] = useState(null)
  const [tokenBalance, setTokenBalance] = useState(28.2)
  const [claimStatus, setClaimStatus] = useState('idle')
  const [claimMessage, setClaimMessage] = useState('')

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

  const handleClaim = async () => {
    if (claimStatus === 'pending') return
    setClaimStatus('pending')
    setClaimMessage('Pending...')

    await new Promise((resolve) => setTimeout(resolve, 1800))
    setTokenBalance((prev) => prev + 1.5)
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
              <div className="wallet-summary">
                <span className="wallet-label">Freighter</span>
                <span className="wallet-value">{truncateAddress(walletAddress)}</span>
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

      <ThreeScene onClaim={handleClaim} claimStatus={claimStatus} />

      <div className="hud left">
        <div className="panel">
          <div className="panel-title">STAR BALANCE</div>
          <div className="panel-value">{tokenBalance.toFixed(2)} STAR</div>
          {claimStatus !== 'idle' && (
            <div className={`claim-status ${claimStatus}`}>{claimMessage}</div>
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
        <button onClick={connectWallet}>Wallet</button>
        <button>Market</button>
        <button>Vault</button>
        <button>Stories</button>
      </div>

      {walletError && <div className="error-toast">{walletError}</div>}
    </div>
  )
}
