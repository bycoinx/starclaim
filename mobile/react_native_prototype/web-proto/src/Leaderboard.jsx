import React, { useState, useEffect } from 'react'
import './Leaderboard.css'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/leaderboard/top?limit=50')
        if (!res.ok) throw new Error('Failed to fetch leaderboard')
        const data = await res.json()
        setLeaderboard(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  if (loading) return <div className="leaderboard-loading">Loading top stars...</div>

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>TOP 50 STARHOLDERS</h2>
        <p>Galactic Prestige Ranking</p>
      </div>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>NAME</th>
            <th>STARS</th>
            <th>POINTS</th>
            <th>REFERRAL</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, idx) => (
            <tr key={entry.user_id} className={`rank-${Math.min(idx, 2)}`}>
              <td className="rank-num">{idx + 1}</td>
              <td className="user-name">{entry.name}</td>
              <td className="stars-owned">{entry.stars_owned}</td>
              <td className="points">{entry.points}</td>
              <td className="referral-code">{entry.referral_code || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
