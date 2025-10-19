export interface Shot {
  timestamp: number;
  result: 'MAKE' | 'MISS';
  distanceIn: number;
  cutAngleDeg: number;
  spinType: 'none' | 'draw' | 'follow' | 'left' | 'right';
  shotType: 'cut' | 'bank' | 'kick' | 'safety' | 'break';
  cueSpeed?: number;
  positionalErrorIn?: number;
  difficultyScore?: number;
}

export interface SessionData {
  shots: Shot[];
  makePercentage?: number;
  breakSuccess?: number;
  avgBallsRun?: number;
  safetyWinPct?: number;
}

export interface CoachTip {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'focus' | 'fix';
  links: { label: string; url: string }[];
  tags: string[];
}

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return (num / den) * 100;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function stdev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = avg(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const variance = avg(squaredDiffs);
  return Math.sqrt(variance);
}

function detectOverdraw(sessionData: SessionData): CoachTip | null {
  const drawShots = sessionData.shots.filter(
    shot => shot.spinType === 'draw' && shot.distanceIn >= 48
  );

  if (drawShots.length === 0) return null;

  const positionalErrors = drawShots
    .filter(shot => shot.positionalErrorIn !== undefined)
    .map(shot => shot.positionalErrorIn!);

  if (positionalErrors.length === 0) return null;

  const avgError = avg(positionalErrors);

  if (avgError > 8) {
    return {
      id: 'overdraw-detection',
      title: 'Overdraw on Long Shots',
      body: 'Your draw shots beyond 48 inches show excessive positional error (avg ' + 
            avgError.toFixed(1) + ' inches). Raise tip from ~50% to ~40% below center, hit cleaner.',
      severity: 'fix',
      links: [
        { label: 'Dr. Dave: Optimal Tip Height', url: 'https://drdavepoolinfo.com/faq/cue-tip/height/' }
      ],
      tags: ['draw', 'distance-control', 'tip-height']
    };
  }

  return null;
}

function detectSpinBias(sessionData: SessionData): CoachTip | null {
  const leftSpinShots = sessionData.shots.filter(shot => shot.spinType === 'left');
  const rightSpinShots = sessionData.shots.filter(shot => shot.spinType === 'right');

  if (leftSpinShots.length === 0 || rightSpinShots.length === 0) return null;

  const leftMakes = leftSpinShots.filter(shot => shot.result === 'MAKE').length;
  const rightMakes = rightSpinShots.filter(shot => shot.result === 'MAKE').length;

  const leftPct = pct(leftMakes, leftSpinShots.length);
  const rightPct = pct(rightMakes, rightSpinShots.length);

  const difference = Math.abs(leftPct - rightPct);

  if (difference > 7) {
    const weaker = leftPct < rightPct ? 'left' : 'right';
    return {
      id: 'spin-bias-detection',
      title: 'Left/Right English Asymmetry',
      body: 'You make ' + leftPct.toFixed(1) + '% with left spin vs ' + rightPct.toFixed(1) + 
            '% with right spin (difference: ' + difference.toFixed(1) + '%). ' +
            'Drill mirrored patterns, ensure visual alignment, keep cue level.',
      severity: 'focus',
      links: [
        { label: 'Dr. Dave: Fundamentals', url: 'https://drdavepoolinfo.com/tutorial/fundamentals/' }
      ],
      tags: ['sidespin', 'alignment', weaker + '-english']
    };
  }

  return null;
}

function detectFollowInconsistency(sessionData: SessionData): CoachTip | null {
  const followShots = sessionData.shots.filter(
    shot => shot.spinType === 'follow' && 
            shot.distanceIn >= 30 && 
            shot.distanceIn <= 70
  );

  if (followShots.length === 0) return null;

  const positionalErrors = followShots
    .filter(shot => shot.positionalErrorIn !== undefined)
    .map(shot => shot.positionalErrorIn!);

  if (positionalErrors.length === 0) return null;

  const standardDeviation = stdev(positionalErrors);

  if (standardDeviation > 14) {
    return {
      id: 'follow-inconsistency',
      title: 'Follow Speed Inconsistency',
      body: 'Your follow shots (30-70 inches) show high positional variance (stdev: ' + 
            standardDeviation.toFixed(1) + ' inches). Strike ~20% above center with smooth tempo for consistent distance.',
      severity: 'focus',
      links: [
        { label: 'Dr. Dave: Speed Control', url: 'https://drdavepoolinfo.com/faq/speed/optimal-tip-height/' }
      ],
      tags: ['follow', 'speed-control', 'consistency']
    };
  }

  return null;
}

function detectLongLeftEnglishMisses(sessionData: SessionData): CoachTip | null {
  const longLeftCuts = sessionData.shots.filter(
    shot => shot.distanceIn >= 60 &&
            shot.spinType === 'left' &&
            shot.cutAngleDeg >= 15 &&
            shot.cutAngleDeg <= 45
  );

  if (longLeftCuts.length === 0) return null;

  const misses = longLeftCuts.filter(shot => shot.result === 'MISS').length;
  const missRate = pct(misses, longLeftCuts.length);

  const baselineMissRate = sessionData.makePercentage 
    ? 100 - sessionData.makePercentage 
    : 30;

  if (missRate > baselineMissRate + 12) {
    return {
      id: 'long-left-english',
      title: 'Long Left English Misses',
      body: 'Missing ' + missRate.toFixed(1) + '% on long (60"+) left-english cuts (15-45°), ' +
            'vs baseline miss rate of ' + baselineMissRate.toFixed(1) + '%. ' +
            'Reduce side or add BHE compensation, slow speed to let swerve settle.',
      severity: 'fix',
      links: [
        { label: 'Dr. Dave: Sidespin Effects', url: 'https://drdavepoolinfo.com/faq/sidespin/aim/effects/' }
      ],
      tags: ['sidespin', 'swerve', 'left-english', 'long-shots']
    };
  }

  return null;
}

function detectBreakAccuracy(sessionData: SessionData): CoachTip | null {
  const breakShots = sessionData.shots.filter(shot => shot.shotType === 'break');

  if (breakShots.length === 0) return null;

  const breaksWithError = breakShots.filter(
    shot => shot.positionalErrorIn !== undefined && shot.positionalErrorIn > 6
  );

  const errorRate = pct(breaksWithError.length, breakShots.length);

  if (errorRate > 35) {
    return {
      id: 'break-accuracy',
      title: 'Break Accuracy Issues',
      body: breaksWithError.length + ' of ' + breakShots.length + ' breaks (' + 
            errorRate.toFixed(1) + '%) had positional error > 6 inches. ' +
            'Back off power until you can square the head ball consistently. Accuracy first, power second.',
      severity: 'fix',
      links: [
        { label: 'Dr. Dave: Break Advice', url: 'https://drdavepoolinfo.com/faq/break/advice/' }
      ],
      tags: ['break', 'accuracy', 'power-control']
    };
  }

  return null;
}

function detectSafetyConversion(sessionData: SessionData): CoachTip | null {
  const safetyShots = sessionData.shots.filter(shot => shot.shotType === 'safety');

  if (safetyShots.length === 0) return null;

  const successfulSafeties = safetyShots.filter(shot => shot.result === 'MAKE').length;
  const successRate = pct(successfulSafeties, safetyShots.length);

  const providedSafetyRate = sessionData.safetyWinPct;
  const effectiveRate = providedSafetyRate !== undefined ? providedSafetyRate : successRate;

  if (effectiveRate < 45) {
    return {
      id: 'safety-conversion',
      title: 'Safety Conversion Gap',
      body: 'Your safety success rate is ' + effectiveRate.toFixed(1) + '% (below 45% threshold). ' +
            'Favor fuller contact and use rail-first "two-way" options.',
      severity: 'focus',
      links: [
        { label: 'Safety Play Strategy', url: '' }
      ],
      tags: ['safety', 'defensive-play', 'strategy']
    };
  }

  return null;
}

export function generateCoachInsights(sessionData: SessionData): CoachTip[] {
  const allTips: CoachTip[] = [];

  const overdraw = detectOverdraw(sessionData);
  if (overdraw) allTips.push(overdraw);

  const spinBias = detectSpinBias(sessionData);
  if (spinBias) allTips.push(spinBias);

  const followInconsistency = detectFollowInconsistency(sessionData);
  if (followInconsistency) allTips.push(followInconsistency);

  const longLeftEnglish = detectLongLeftEnglishMisses(sessionData);
  if (longLeftEnglish) allTips.push(longLeftEnglish);

  const breakAccuracy = detectBreakAccuracy(sessionData);
  if (breakAccuracy) allTips.push(breakAccuracy);

  const safetyConversion = detectSafetyConversion(sessionData);
  if (safetyConversion) allTips.push(safetyConversion);

  const priorityOrder = { 'fix': 0, 'focus': 1, 'info': 2 };
  allTips.sort((a, b) => priorityOrder[a.severity] - priorityOrder[b.severity]);

  return allTips.slice(0, 5);
}
