import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePercentageChange,
  detectPollutionSpikes,
  aggregateDailySummaries,
  generateRealDataInsights,
} from './pollutionAnalysis';
import { HourlyAirQualityPoint } from '../types/airQuality';

test('calculatePercentageChange accurately calculates up, down, and stable directions', () => {
  // Up change: 50 -> 75 is +50%
  const up = calculatePercentageChange(50, 75);
  assert.deepEqual(up, { percent: 50, direction: 'up' });

  // Down change: 100 -> 60 is -40%
  const down = calculatePercentageChange(100, 60);
  assert.deepEqual(down, { percent: 40, direction: 'down' });

  // Stable change: 50 -> 50.2
  const stable = calculatePercentageChange(50, 50.2);
  assert.deepEqual(stable, { percent: 0, direction: 'stable' });

  // Null inputs
  assert.equal(calculatePercentageChange(null, 50), null);
  assert.equal(calculatePercentageChange(50, null), null);
});

test('detectPollutionSpikes isolates statistical anomalies above threshold', () => {
  const points: HourlyAirQualityPoint[] = [
    { time: '2026-11-01T00:00', timestamp: '2026-11-01T00:00', europeanAqi: 20, usAqi: 30, pm2_5: 15, pm10: 25, no2: 10, o3: 20, so2: 5, co: 200 },
    { time: '2026-11-01T01:00', timestamp: '2026-11-01T01:00', europeanAqi: 22, usAqi: 32, pm2_5: 16, pm10: 26, no2: 11, o3: 20, so2: 5, co: 200 },
    { time: '2026-11-01T02:00', timestamp: '2026-11-01T02:00', europeanAqi: 21, usAqi: 31, pm2_5: 15, pm10: 25, no2: 10, o3: 20, so2: 5, co: 200 },
    { time: '2026-11-01T03:00', timestamp: '2026-11-01T03:00', europeanAqi: 25, usAqi: 35, pm2_5: 18, pm10: 28, no2: 12, o3: 20, so2: 5, co: 200 },
    { time: '2026-11-01T04:00', timestamp: '2026-11-01T04:00', europeanAqi: 20, usAqi: 30, pm2_5: 15, pm10: 25, no2: 10, o3: 20, so2: 5, co: 200 },
    // Anomaly spike at 05:00
    { time: '2026-11-01T05:00', timestamp: '2026-11-01T05:00', europeanAqi: 85, usAqi: 160, pm2_5: 88, pm10: 120, no2: 45, o3: 20, so2: 10, co: 400 },
    { time: '2026-11-01T06:00', timestamp: '2026-11-01T06:00', europeanAqi: 20, usAqi: 30, pm2_5: 15, pm10: 25, no2: 10, o3: 20, so2: 5, co: 200 },
  ];

  const spikes = detectPollutionSpikes(points, 'pm2_5');
  assert.ok(spikes.length >= 1, 'Should detect at least 1 spike');
  assert.equal(spikes[0].time, '2026-11-01T05:00');
  assert.equal(spikes[0].value, 88);
  assert.equal(spikes[0].severity, 'severe');
});

test('aggregateDailySummaries aggregates hourly readings into valid daily statistics', () => {
  const points: HourlyAirQualityPoint[] = [
    { time: '2026-11-01T00:00', timestamp: '2026-11-01T00:00', europeanAqi: 20, usAqi: 30, pm2_5: 10, pm10: 20, no2: 10, o3: 20, so2: 5, co: 200 },
    { time: '2026-11-01T12:00', timestamp: '2026-11-01T12:00', europeanAqi: 40, usAqi: 50, pm2_5: 20, pm10: 40, no2: 15, o3: 25, so2: 5, co: 200 },
    { time: '2026-11-02T00:00', timestamp: '2026-11-02T00:00', europeanAqi: 60, usAqi: 80, pm2_5: 35, pm10: 60, no2: 20, o3: 30, so2: 5, co: 200 },
  ];

  const summaries = aggregateDailySummaries(points, 'EAQI');
  assert.equal(summaries.length, 2);
  assert.equal(summaries[0].date, '2026-11-01');
  assert.equal(summaries[0].avgAqi, 30);
  assert.equal(summaries[0].maxAqi, 40);
  assert.equal(summaries[0].minAqi, 20);
  assert.equal(summaries[0].avgPm25, 15);
  assert.equal(summaries[1].date, '2026-11-02');
  assert.equal(summaries[1].avgAqi, 60);
});

test('aggregateDailySummaries preserves unavailable pollutant data as null', () => {
  const summaries = aggregateDailySummaries(
    [{
      time: '2026-11-01T00:00',
      timestamp: '2026-11-01T00:00',
      europeanAqi: 20,
      usAqi: 30,
      pm2_5: null,
      pm10: null,
      no2: null,
      o3: null,
      so2: null,
      co: null,
    }],
    'EAQI'
  );

  assert.equal(summaries[0].avgPm25, null);
  assert.equal(summaries[0].avgPm10, null);
  assert.equal(summaries[0].dominantPollutant, 'Unavailable');
});

test('generateRealDataInsights provides factual insights without hallucinating', () => {
  const insights = generateRealDataInsights(
    45,
    'EAQI',
    { pm2_5: 45, pm10: 60, no2: 20, o3: 90, so2: 5, co: 200 },
    { temperature: 28, humidity: 80, windSpeed: 3 }
  );

  assert.ok(insights.length >= 3);
  // Contains WHO guideline comparison
  assert.ok(insights.some(i => i.includes('WHO 24-hour safe guideline')));
  // Contains wind speed insight
  assert.ok(insights.some(i => i.includes('Stagnant air conditions detected')));
  // Contains ozone insight
  assert.ok(insights.some(i => i.includes('ground-level ozone')));
});
