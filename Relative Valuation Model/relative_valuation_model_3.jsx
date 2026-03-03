import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, Trash2, DollarSign, BarChart3, AlertCircle } from 'lucide-react';

export default function RelativeValuationModel() {
  const [targetCompany, setTargetCompany] = useState({
    name: 'Target Company',
    price: 50,
    sharesOutstanding: 100,
    earnings: 500,
    ebitda: 750,
    enterpriseValue: 5000
  });

  const [peers, setPeers] = useState([
    { id: 1, name: 'Peer A', price: 45, sharesOutstanding: 120, earnings: 480, ebitda: 720, enterpriseValue: 4800 },
    { id: 2, name: 'Peer B', price: 55, sharesOutstanding: 110, earnings: 550, ebitda: 800, enterpriseValue: 5200 }
  ]);

  const [nextId, setNextId] = useState(3);

  const calculateMultiples = (company) => {
    const marketCap = company.price * company.sharesOutstanding;
    return {
      pe: company.earnings > 0 ? marketCap / company.earnings : null,
      evEbitda: company.ebitda > 0 ? company.enterpriseValue / company.ebitda : null,
      priceToBefore: company.ebitda > 0 ? marketCap / company.ebitda : null,
      psEbitda: company.earnings > 0 ? company.enterpriseValue / company.earnings : null
    };
  };

  const peerMultiples = useMemo(() => {
    return peers.map(peer => ({
      ...peer,
      multiples: calculateMultiples(peer)
    }));
  }, [peers]);

  const targetMultiples = useMemo(() => calculateMultiples(targetCompany), [targetCompany]);

  const getMedianMultiples = (metric) => {
    const values = peerMultiples
      .map(p => p.multiples[metric])
      .filter(v => v !== null && v !== Infinity && v !== -Infinity)
      .sort((a, b) => a - b);
    
    if (values.length === 0) return null;
    return values[Math.floor(values.length / 2)];
  };

  const getPeerStats = (metric) => {
    const values = peerMultiples
      .map(p => p.multiples[metric])
      .filter(v => v !== null && v !== Infinity && v !== -Infinity && v > 0);
    
    if (values.length === 0) return null;
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      median: values[Math.floor(values.length / 2)],
      mean: values.reduce((a, b) => a + b, 0) / values.length
    };
  };

  const calculateImpliedValue = (metric, multiplier) => {
    if (metric === 'pe') {
      return targetCompany.earnings * multiplier / targetCompany.sharesOutstanding;
    } else if (metric === 'evEbitda') {
      const impliedEV = targetCompany.ebitda * multiplier;
      return impliedEV / targetCompany.sharesOutstanding;
    }
    return null;
  };

  const updateTargetCompany = (field, value) => {
    setTargetCompany(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const updatePeer = (id, field, value) => {
    setPeers(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: parseFloat(value) || 0 } : p
    ));
  };

  const addPeer = () => {
    setPeers(prev => [...prev, {
      id: nextId,
      name: `Peer ${String.fromCharCode(65 + (nextId - 1))}`,
      price: 50,
      sharesOutstanding: 100,
      earnings: 500,
      ebitda: 750,
      enterpriseValue: 5000
    }]);
    setNextId(nextId + 1);
  };

  const removePeer = (id) => {
    setPeers(prev => prev.filter(p => p.id !== id));
  };

  const peStats = getPeerStats('pe');
  const evStats = getPeerStats('evEbitda');

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%)',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: '"Geist", "Segoe UI", sans-serif',
      color: '#e2e8f0'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input, textarea { font-family: "Fira Code", monospace; }
        input:focus, textarea:focus { outline: none; }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
        }
        input {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.5);
          color: #e2e8f0;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          transition: all 0.2s;
        }
        input:hover {
          border-color: rgba(71, 85, 105, 0.8);
          background: rgba(30, 41, 59, 0.8);
        }
        input:focus {
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 1);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        button {
          transition: all 0.2s;
        }
        button:hover {
          transform: translateY(-1px);
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <BarChart3 size={32} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
              Relative Valuation Model
            </h1>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0, marginTop: '0.5rem' }}>
            Comparable company analysis using multiples-based valuation
          </p>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Target Company */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '8px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)'
          }} className="card-hover">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: '#3b82f6' }}>
              Target Company
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={targetCompany.name}
                  onChange={(e) => setTargetCompany(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>
              {['price', 'sharesOutstanding', 'earnings', 'ebitda', 'enterpriseValue'].map(field => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 500 }}>
                    {field === 'price' ? 'Stock Price ($)' : 
                     field === 'sharesOutstanding' ? 'Shares Outstanding (M)' :
                     field === 'earnings' ? 'Net Income ($M)' :
                     field === 'ebitda' ? 'EBITDA ($M)' : 'Enterprise Value ($M)'}
                  </label>
                  <input
                    type="number"
                    value={targetCompany[field]}
                    onChange={(e) => updateTargetCompany(field, e.target.value)}
                    style={{ width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '8px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: '#10b981' }}>
              Target Multiples
            </h2>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10b981', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.3rem' }}>P/E RATIO</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
                  {targetMultiples.pe ? targetMultiples.pe.toFixed(2) : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #3b82f6', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.3rem' }}>EV/EBITDA</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>
                  {targetMultiples.evEbitda ? targetMultiples.evEbitda.toFixed(2) : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.05)', borderLeft: '3px solid #a855f7', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.3rem' }}>MARKET CAP</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#a855f7' }}>
                  ${(targetCompany.price * targetCompany.sharesOutstanding).toFixed(0)}M
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peer Companies */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#f59e0b' }}>
              Peer Companies
            </h2>
            <button
              onClick={addPeer}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              <Plus size={16} /> Add Peer
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(71, 85, 105, 0.5)' }}>
                  {['Company', 'Price', 'Shares (M)', 'Earnings (M)', 'EBITDA (M)', 'EV (M)', 'P/E', 'EV/EBITDA', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {peerMultiples.map((peer) => (
                  <tr key={peer.id} style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.3)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={peer.name}
                        onChange={(e) => updatePeer(peer.id, 'name', e.target.value)}
                        style={{ width: '120px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={peer.price}
                        onChange={(e) => updatePeer(peer.id, 'price', e.target.value)}
                        style={{ width: '70px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={peer.sharesOutstanding}
                        onChange={(e) => updatePeer(peer.id, 'sharesOutstanding', e.target.value)}
                        style={{ width: '70px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={peer.earnings}
                        onChange={(e) => updatePeer(peer.id, 'earnings', e.target.value)}
                        style={{ width: '70px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={peer.ebitda}
                        onChange={(e) => updatePeer(peer.id, 'ebitda', e.target.value)}
                        style={{ width: '70px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        value={peer.enterpriseValue}
                        onChange={(e) => updatePeer(peer.id, 'enterpriseValue', e.target.value)}
                        style={{ width: '70px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                      {peer.multiples.pe ? peer.multiples.pe.toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                      {peer.multiples.evEbitda ? peer.multiples.evEbitda.toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => removePeer(peer.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Valuation Analysis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* P/E Based Valuation */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '8px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)'
          }} className="card-hover">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: '#10b981' }}>
              P/E Multiple Valuation
            </h2>
            {peStats ? (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Median P/E</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{peStats.median.toFixed(2)}x</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Mean P/E</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{peStats.mean.toFixed(2)}x</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Low P/E</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{peStats.min.toFixed(2)}x</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>High P/E</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{peStats.max.toFixed(2)}x</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(71, 85, 105, 0.3)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    <strong>Implied Value Range (per share)</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Low Estimate:</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>${calculateImpliedValue('pe', peStats.min).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Median Estimate:</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>${calculateImpliedValue('pe', peStats.median).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>High Estimate:</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>${calculateImpliedValue('pe', peStats.max).toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(71, 85, 105, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Current Price:</span>
                        <span style={{ color: '#3b82f6', fontWeight: 600 }}>${targetCompany.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
                <AlertCircle size={16} />
                <span>Insufficient peer data</span>
              </div>
            )}
          </div>

          {/* EV/EBITDA Based Valuation */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '8px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)'
          }} className="card-hover">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: '#3b82f6' }}>
              EV/EBITDA Multiple Valuation
            </h2>
            {evStats ? (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Median EV/EBITDA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{evStats.median.toFixed(2)}x</div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Mean EV/EBITDA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{evStats.mean.toFixed(2)}x</div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Low EV/EBITDA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{evStats.min.toFixed(2)}x</div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>High EV/EBITDA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{evStats.max.toFixed(2)}x</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(71, 85, 105, 0.3)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    <strong>Implied Value Range (per share)</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Low Estimate:</span>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>${calculateImpliedValue('evEbitda', evStats.min).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Median Estimate:</span>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>${calculateImpliedValue('evEbitda', evStats.median).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>High Estimate:</span>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>${calculateImpliedValue('evEbitda', evStats.max).toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(71, 85, 105, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Current Price:</span>
                        <span style={{ color: '#3b82f6', fontWeight: 600 }}>${targetCompany.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
                <AlertCircle size={16} />
                <span>Insufficient peer data</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '8px',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} style={{ color: '#3b82f6' }} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              Valuation Summary
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <strong style={{ color: '#cbd5e1' }}>P/E Analysis:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>
                {peStats ? `Target trading at ${(targetMultiples.pe / peStats.median).toFixed(2)}x the median peer multiple` : 'Awaiting data'}
              </p>
            </div>
            <div>
              <strong style={{ color: '#cbd5e1' }}>EV/EBITDA Analysis:</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>
                {evStats ? `Target trading at ${(targetMultiples.evEbitda / evStats.median).toFixed(2)}x the median peer multiple` : 'Awaiting data'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}