import React, { useState } from 'react';
import { Icon } from './Icons';
import { citizenTiers, badgesList, perksCatalog, cityLeaderboard } from '../data/rewardsData';
import PerkPassModal from './PerkPassModal';
import { sound } from '../utils/audio';
import { launchConfetti } from '../utils/confetti';
import { civicApi } from '../utils/api';

export default function RewardsHub({ points, onPointsChange, issues = [], citizenName = 'Jordan Davis' }) {
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchReward, setScratchReward] = useState({ points: 50, code: 'CIVIC-BONUS-884' });
  const [redeemedPerks, setRedeemedPerks] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [activeTab, setActiveTab] = useState('perks');

  const currentTier = citizenTiers.find((t) => points >= t.minPoints && points < t.maxPoints) || citizenTiers[0];
  const nextTier = citizenTiers[citizenTiers.indexOf(currentTier) + 1] || currentTier;
  const progressPercent = Math.min(100, Math.round(((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints || 1)) * 100));

  const handleScratch = () => {
    if (scratchRevealed) return;
    sound.playScratch();
    setTimeout(() => {
      sound.playSuccess();
      launchConfetti(0.5, 0.4);
      setScratchRevealed(true);
      onPointsChange(points + scratchReward.points);
    }, 400);
  };

  const handleRedeemPerk = async (perk) => {
    if (points < perk.cost) {
      sound.playAlert();
      alert(`You need ${perk.cost - points} more Karma points to unlock this community perk.`);
      return;
    }
    sound.playSuccess();
    launchConfetti(0.5, 0.5);
    onPointsChange(points - perk.cost);
    setRedeemedPerks([...redeemedPerks, perk.id]);

    const res = await civicApi.redeemPerk(perk.id, citizenName);
    setSelectedPass(res.pass || perk);
  };

  return (
    <div className="rewards-hub-page">
      {/* Top Hero Banner */}
      <div className="rewards-hero-card">
        <div className="rewards-hero-content">
          <div className="tier-badge-pill" style={{ borderColor: currentTier.color }}>
            <Icon.Sparkles size={14} />
            <span>{currentTier.name.toUpperCase()} TIER</span>
          </div>

          <h2>Your Civic Impact & Recognition</h2>
          <p>
            Every verified report keeps your community safe, clean, and vibrant. Earn civic karma, unlock municipal perks, and climb the city leaderboard.
          </p>

          <div className="tier-progress-box">
            <div className="tier-progress-labels">
              <span>Current: <b>{currentTier.name}</b></span>
              <span>Next: <b>{nextTier.name}</b> ({nextTier.minPoints - points} pts to level up)</span>
            </div>
            <div className="tier-bar-track">
              <div className="tier-bar-fill" style={{ width: `${progressPercent}%`, backgroundColor: currentTier.color }}></div>
            </div>
          </div>
        </div>

        <div className="points-display-card">
          <div className="points-icon-ring">
            <Icon.Award size={28} />
          </div>
          <div className="points-number">{points}</div>
          <span className="points-title">Karma Points Available</span>
          <small className="points-sub">1 Point = 1 Verified Action</small>
        </div>
      </div>

      {/* Gamified Scratch Card Section */}
      <div className="scratch-promo-section">
        <div className="scratch-copy">
          <div className="scratch-tag">
            <Icon.Sparkles size={13} />
            <span>DAILY CIVIC CITIZEN LOTTERY</span>
          </div>
          <h3>Daily Community Bonus Card</h3>
          <p>Scratch to reveal bonus points sponsored by the Municipal Innovation Council.</p>
        </div>

        <div className="scratch-card-wrapper">
          <div
            className={`holographic-scratch-card ${scratchRevealed ? 'revealed' : ''}`}
            onClick={handleScratch}
          >
            {scratchRevealed ? (
              <div className="scratch-content revealed">
                <Icon.CheckCircle size={32} />
                <b>+{scratchReward.points} KARMA POINTS!</b>
                <span className="voucher-code">{scratchReward.code}</span>
                <small>Added to your balance</small>
              </div>
            ) : (
              <div className="scratch-content unrevealed">
                <Icon.Sparkles size={32} />
                <b>CLICK OR TAP TO SCRATCH FOIL</b>
                <span>Mystery Civic Karma Reward</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="rewards-subtabs">
        <button
          className={`subtab-btn ${activeTab === 'perks' ? 'active' : ''}`}
          onClick={() => {
            sound.playClick();
            setActiveTab('perks');
          }}
        >
          <Icon.Zap size={14} />
          <span>Redeemable Perks ({perksCatalog.length})</span>
        </button>

        <button
          className={`subtab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => {
            sound.playClick();
            setActiveTab('leaderboard');
          }}
        >
          <Icon.Award size={14} />
          <span>City Guardian Leaderboard</span>
        </button>

        <button
          className={`subtab-btn ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => {
            sound.playClick();
            setActiveTab('badges');
          }}
        >
          <Icon.Shield size={14} />
          <span>Milestones & Badges</span>
        </button>
      </div>

      {/* Tab 1: Perks Catalog */}
      {activeTab === 'perks' && (
        <div className="perks-grid">
          {perksCatalog.map((perk) => {
            const isRedeemed = redeemedPerks.includes(perk.id);
            const canAfford = points >= perk.cost;

            return (
              <div key={perk.id} className={`perk-card ${isRedeemed ? 'redeemed' : ''}`}>
                <div className="perk-top">
                  <span className="perk-category">{perk.category}</span>
                  <span className="perk-cost">
                    <Icon.Sparkles size={12} /> {perk.cost} pts
                  </span>
                </div>

                <h4 className="perk-title">{perk.title}</h4>
                <p className="perk-desc">{perk.desc}</p>

                <div className="perk-footer">
                  {isRedeemed ? (
                    <button
                      className="voucher-claimed-box btn-pass-view"
                      onClick={() => setSelectedPass(perk)}
                    >
                      <Icon.Check size={12} />
                      <span>View Digital Pass (<b>{perk.code}</b>)</span>
                    </button>
                  ) : (
                    <button
                      className={`btn-redeem ${canAfford ? 'affordable' : 'locked'}`}
                      disabled={!canAfford}
                      onClick={() => handleRedeemPerk(perk)}
                    >
                      <Icon.Sparkles size={13} />
                      <span>{canAfford ? 'Redeem Voucher' : `Need ${perk.cost - points} more pts`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <div>
              <h3>Metro Civic Watchman Rankings</h3>
              <p>Top active contributors in your metropolitan region this month.</p>
            </div>
            <span className="leaderboard-updated">Live Sync • Ward 4</span>
          </div>

          <div className="leaderboard-list">
            {cityLeaderboard.map((item) => (
              <div key={item.rank} className={`leaderboard-row ${item.rank === 1 ? 'user-highlight' : ''}`}>
                <div className="rank-badge">#{item.rank}</div>
                <div className="user-avatar-circle">{item.avatar}</div>
                <div className="user-info-col">
                  <b>{item.name}</b>
                  <small>{item.district} • {item.reports} verified reports</small>
                </div>
                <div className="badge-tag-col">
                  <span className="tier-tag">{item.badge}</span>
                </div>
                <div className="user-points-col">
                  <b>{item.points}</b>
                  <small>PTS</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Milestones & Badges */}
      {activeTab === 'badges' && (
        <div className="badges-grid">
          {badgesList.map((badge) => {
            const isUnlocked = points >= badge.pointsReq;
            return (
              <div key={badge.id} className={`badge-card-pro ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="badge-icon-wrap">
                  <Icon.Shield size={26} />
                  {isUnlocked && <span className="unlocked-check"><Icon.Check size={10} /></span>}
                </div>
                <h4>{badge.title}</h4>
                <p>{badge.desc}</p>
                <div className="badge-status-bar">
                  {isUnlocked ? (
                    <span className="status-unlocked">✓ UNLOCKED</span>
                  ) : (
                    <span className="status-locked">Requires {badge.pointsReq} Points</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Pass Modal */}
      {selectedPass && (
        <PerkPassModal
          perk={selectedPass}
          citizenName={citizenName}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
}
