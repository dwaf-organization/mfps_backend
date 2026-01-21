export interface WeightRow {
  measurement_code: number;
  create_at: Date;
  sensor_index: number;
  value: number;
}

const CHANGE_RATIO = 0.15;        // 평균 대비 15%
const CHANGE_ABSOLUTE = 100_000;
const CONTINUOUS_MINUTES = 3;     // 3분 연속
const MIN_SENSORS_CHANGED = 1;    // 한 measurement에서 최소 몇 개 센서가 튀면 "변화"로 볼지

export function calcSensorAverages(rows: WeightRow[]) {
  const sum = new Map<number, number>();
  const count = new Map<number, number>();

  for (const r of rows) {
    sum.set(r.sensor_index, (sum.get(r.sensor_index) ?? 0) + Number(r.value));
    count.set(r.sensor_index, (count.get(r.sensor_index) ?? 0) + 1);
  }

  const avg = new Map<number, number>();
  for (const [sensor, total] of sum) {
    avg.set(sensor, total / (count.get(sensor) ?? 1));
  }

  return avg;
}

function isPostureChanged(value: number, avg: number): boolean {
  const diff = Math.abs(value - avg);
  return diff >= CHANGE_ABSOLUTE;
}

/**
 * 마지막 움직임 시점 찾기 (measurement 단위로)
 * - 같은 measurement_code(=1분)를 하나의 측정으로 보고
 * - 그 측정에서 N개 이상의 센서가 평균 대비 15% 이상 튀면 "움직임"
 * - 이런 "움직임"이 3회 연속이면 마지막 움직임 시각 갱신
 */
export function findLastMovementTime(
  rows: WeightRow[],
  avgMap: Map<number, number>,
): Date | null {
  // 1) measurement_code 기준 그룹핑
  const byMeasure = new Map<number, { create_at: Date; sensors: Map<number, number> }>();

  for (const r of rows) {
    const code = Number(r.measurement_code);
    if (!byMeasure.has(code)) {
      byMeasure.set(code, { create_at: r.create_at, sensors: new Map() });
    }
    byMeasure.get(code)!.sensors.set(r.sensor_index, Number(r.value));
  }

  // 2) 시간 오름차순으로 정렬
  const measures = Array.from(byMeasure.entries())
    .sort((a, b) => a[1].create_at.getTime() - b[1].create_at.getTime());

  let streak = 0;
  let lastMove: Date | null = null;

  for (const [, m] of measures) {
    let changedSensors = 0;

    for (const [sensor, value] of m.sensors.entries()) {
      const avg = avgMap.get(sensor);
      if (!avg) continue;

      if (isPostureChanged(value, avg)) changedSensors++;
    }

    const movedThisMinute = changedSensors >= MIN_SENSORS_CHANGED;

    if (movedThisMinute) {
      streak++;
      if (streak >= CONTINUOUS_MINUTES) {
        lastMove = m.create_at;
      }
    } else {
      streak = 0;
    }
  }

  return lastMove;
}

export function decideWarningState(
  lastMove: Date | null,
  anchor: Date,
): number {
  // 한 번도 움직임이 감지되지 않은 경우
  if (!lastMove) {
    const diffMinutes = 120; // 최소 위험으로 간주
    return 2;
  }

  const diffMinutes = (anchor.getTime() - lastMove.getTime()) / 60000;

  if (diffMinutes >= 120) return 2; // 위험
  if (diffMinutes >= 60) return 1;  // 경고
  return 0;                          // 안정
}

