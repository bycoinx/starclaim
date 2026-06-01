import React, { useState, useEffect } from 'react'
import './Engagement.css'

export default function Engagement({ userToken }) {
  const [streak, setStreak] = useState(0)
  const [checkInDone, setCheckInDone] = useState(false)
  const [reward, setReward] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleDailyCheckin = async () => {
    if (!userToken || checkInDone || loading) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/engagement/daily-checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (res.ok) {
        setStreak(data.daily_streak)
        setReward(data.reward)
        setCheckInDone(true)
      }
    } catch (err) {
      console.error('Check-in failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="engagement-panel">
      <div className="engagement-title">DAILY MISSION</div>
      <div className="engagement-content">
        <div className="streak-display">
          <div className="streak-label">STREAK</div>
          <div className="streak-value">{streak}</div>
        </div>
        <button
          className={`checkin-button ${checkInDone ? 'done' : ''}`}
          onClick={handleDailyCheckin}
          disabled={checkInDone || !userToken}
        >
          {checkInDone ? `✓ +${reward} Points` : 'Check In'}
        </button>
      </div>
    </div>
  )
}
