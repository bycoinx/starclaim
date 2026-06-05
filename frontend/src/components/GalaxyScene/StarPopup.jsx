function bvToSpectral(ci) {
  if (ci === null || ci === undefined || isNaN(ci)) return 'Unknown';
  const v = parseFloat(ci);
  if (v < -0.3) return 'O/B';
  if (v < 0.0) return 'B/A';
  if (v < 0.3) return 'A/F';
  if (v < 0.6) return 'F/G';
  if (v < 1.0) return 'K';
  return 'M';
}

export default function StarPopup({ star, onClose, onClaim }) {
  if (!star) return null;
  const ly = star.dist ? (star.dist * 3.26156).toFixed(2) : '—';
  const pc = star.dist ? parseFloat(star.dist).toFixed(2) : '—';
  const ra = star.ra != null ? star.ra.toFixed(3) : '—';
  const dec = star.dec != null ? star.dec.toFixed(3) : '—';

  return (
    <div style={{position:'absolute',right:20,top:120,width:320,background:'rgba(6,10,12,0.85)',color:'#dfeffb',padding:16,borderRadius:8,border:'1px solid rgba(100,220,255,0.06)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontSize:16,fontWeight:700}}>{star.proper || `HIP-${star.id}`}</div>
        <button onClick={onClose} style={{background:'transparent',color:'#9fd7ff',border:'none',cursor:'pointer'}}>✕</button>
      </div>
      <div style={{fontSize:13,opacity:0.9}}>RA: {ra}  —  Dec: {dec}</div>
      <div style={{fontSize:13,opacity:0.9}}>Distance: {pc} pc ({ly} ly)</div>
      <div style={{fontSize:13,opacity:0.9}}>Mag: {star.mag}</div>
      <div style={{fontSize:13,opacity:0.9}}>Spectral: {bvToSpectral(star.ci)}</div>
      <div style={{marginTop:12,display:'flex',gap:8}}>
        <button onClick={onClaim} style={{background:'#ffd966',border:'none',padding:'8px 12px',borderRadius:6,cursor:'pointer'}}>Sahiplen</button>
        <a href={`https://simbad.u-strasbg.fr/simbad/sim-id?Ident=${encodeURIComponent(star.proper || 'HIP-'+star.id)}`} target="_blank" rel="noreferrer" style={{marginLeft:'auto',color:'#9fd7ff',alignSelf:'center'}}>Dışarıda Ara</a>
      </div>
    </div>
  );
}
