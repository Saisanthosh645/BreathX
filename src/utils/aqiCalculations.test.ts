import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUsPm25Aqi,
  calculateUsPm10Aqi,
  calculateUsAqi,
  calculateIndPm25Aqi,
  calculateIndPm10Aqi,
  calculateIndAqi,
  getEaqiCategory,
  getUsAqiCategory,
  getIndAqiCategory,
  getCategoryForScale,
  getDominantPollutant,
} from './aqiCalculations';

test('US EPA PM2.5 AQI calculation works correctly across breakpoints', () => {
  // Low level
  assert.equal(calculateUsPm25Aqi(6.0), 25);
  // Boundary 12.0
  assert.equal(calculateUsPm25Aqi(12.0), 50);
  // Moderate (23.75 -> 76 with standard EPA formula)
  assert.equal(calculateUsPm25Aqi(23.75), 76);
  // Unhealthy for Sensitive Groups (around 45)
  const aqi45 = calculateUsPm25Aqi(45);
  assert.ok(aqi45 >= 101 && aqi45 <= 150, `Expected 101-150, got ${aqi45}`);
  // Unhealthy (around 100)
  const aqi100 = calculateUsPm25Aqi(100);
  assert.ok(aqi100 >= 151 && aqi100 <= 200, `Expected 151-200, got ${aqi100}`);
  // Edge cases
  assert.equal(calculateUsPm25Aqi(0), 0);
  assert.equal(calculateUsPm25Aqi(-5), 0);
  assert.equal(calculateUsPm25Aqi(600), 500);
});

test('US EPA PM10 AQI calculation works correctly', () => {
  assert.equal(calculateUsPm10Aqi(27), 25);
  assert.equal(calculateUsPm10Aqi(54), 50);
  assert.ok(calculateUsPm10Aqi(100) >= 51 && calculateUsPm10Aqi(100) <= 100);
});

test('calculateUsAqi takes the maximum sub-index', () => {
  // PM2.5 = 12.0 (AQI 50), PM10 = 154 (AQI 100) -> US AQI should be 100
  const aqi = calculateUsAqi(12.0, 154);
  assert.equal(aqi, 100);

  // When both null
  assert.equal(calculateUsAqi(null, null), null);

  // When only PM2.5 available
  assert.equal(calculateUsAqi(12.0, null), 50);
});

test('Indian CPCB AQI calculation works correctly', () => {
  assert.equal(calculateIndPm25Aqi(15), 25);
  assert.equal(calculateIndPm25Aqi(30), 50);
  assert.equal(calculateIndPm25Aqi(60), 100);
  assert.equal(calculateIndPm10Aqi(50), 50);
  assert.equal(calculateIndPm10Aqi(100), 100);

  const overall = calculateIndAqi(60, 50);
  assert.equal(overall, 100);
});

test('EAQI category classification matches European scale', () => {
  assert.equal(getEaqiCategory(15).category, 'Good');
  assert.equal(getEaqiCategory(30).category, 'Fair');
  assert.equal(getEaqiCategory(55).category, 'Moderate');
  assert.equal(getEaqiCategory(70).category, 'Poor');
  assert.equal(getEaqiCategory(90).category, 'Very Poor');
  assert.equal(getEaqiCategory(115).category, 'Extremely Poor');
  assert.equal(getEaqiCategory(null).category, 'Unknown');
});

test('US AQI category matches EPA definitions', () => {
  assert.equal(getUsAqiCategory(35).category, 'Good');
  assert.equal(getUsAqiCategory(75).category, 'Moderate');
  assert.equal(getUsAqiCategory(120).category, 'Unhealthy for Sensitive Groups');
  assert.equal(getUsAqiCategory(180).category, 'Unhealthy');
  assert.equal(getUsAqiCategory(250).category, 'Very Unhealthy');
  assert.equal(getUsAqiCategory(350).category, 'Hazardous');
});

test('Indian CPCB category matches CPCB labels', () => {
  assert.equal(getIndAqiCategory(40).category, 'Good');
  assert.equal(getIndAqiCategory(80).category, 'Satisfactory');
  assert.equal(getIndAqiCategory(150).category, 'Moderate');
  assert.equal(getIndAqiCategory(250).category, 'Poor');
  assert.equal(getIndAqiCategory(350).category, 'Very Poor');
  assert.equal(getIndAqiCategory(450).category, 'Severe');
});

test('Dominant pollutant logic identifies highest risk relative to guidelines', () => {
  const dom1 = getDominantPollutant({
    pm2_5: 60, // 4x WHO guideline of 15
    pm10: 50,  // ~1.1x WHO guideline of 45
    no2: 20,
    so2: 5,
    co: 500,
    o3: 40,
  });
  assert.equal(dom1, 'PM2.5');

  const dom2 = getDominantPollutant({
    pm2_5: 10,
    pm10: 200, // > 4x WHO guideline
    no2: 20,
    so2: 5,
    co: 500,
    o3: 40,
  });
  assert.equal(dom2, 'PM10');

  const domNull = getDominantPollutant({
    pm2_5: null,
    pm10: null,
    no2: null,
    so2: null,
    co: null,
    o3: null,
  });
  assert.equal(domNull, null);
});
