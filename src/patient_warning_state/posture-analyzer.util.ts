export interface WeightRow {
  measurement_code: number;
  create_at: Date;
  sensor_index: number;
  value: number;
}

const CHANGE_THRESHOLD = 0.10;        // 10%로 변경 (기존 15%)
const CONFIRMATION_COUNT = 3;         // 3번 연속 확인
const STABILITY_THRESHOLD = 0.05;     // 5% 이내면 안정 상태
const CONFIRMATION_TIME_WINDOW = 15;  // 15분 내 연속 변화

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

/**
 * 개선된 자세 변경 감지 알고리즘
 * - 10% 이상 변화를 3번 연속 확인
 * - 일시적 뒤척임과 실제 자세 변경 구분
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

  return detectConfirmedPostureChange(measures, avgMap);
}

/**
 * 확정된 자세 변경 시점 찾기
 */
function detectConfirmedPostureChange(
  measures: Array<[number, { create_at: Date; sensors: Map<number, number> }]>,
  avgMap: Map<number, number>
): Date | null {
  let baselinePattern = new Map<number, number>(avgMap); // 초기 기준값
  let candidateChangeTime: Date | null = null;
  let confirmationCounter = 0;
  let lastConfirmedChange: Date | null = null;

  for (const [, measurement] of measures) {
    const { create_at, sensors } = measurement;
    
    // 현재 측정값이 기준 패턴과 얼마나 다른지 확인
    const maxChange = calculateMaxChange(baselinePattern, sensors);
    
    if (maxChange >= CHANGE_THRESHOLD) {
      // 10% 이상 변화 감지
      
      if (candidateChangeTime === null) {
        // 첫 번째 변화 감지 - 후보로 등록
        candidateChangeTime = create_at;
        confirmationCounter = 1;
      } else {
        // 연속된 변화인지 확인
        const timeDiffMinutes = (create_at.getTime() - candidateChangeTime.getTime()) / 60000;
        
        if (timeDiffMinutes <= CONFIRMATION_TIME_WINDOW) {
          confirmationCounter++;
          
          // 3번 연속 확인되면 자세 변경으로 확정
          if (confirmationCounter >= CONFIRMATION_COUNT) {
            lastConfirmedChange = candidateChangeTime;
            
            // 새로운 기준 패턴으로 업데이트
            baselinePattern = new Map(sensors);
            
            // 리셋
            candidateChangeTime = null;
            confirmationCounter = 0;
          }
        } else {
          // 시간 간격이 너무 벌어짐 - 새로운 후보로 시작
          candidateChangeTime = create_at;
          confirmationCounter = 1;
        }
      }
    } else {
      // 변화가 작음 - 기존 패턴으로 복귀했을 가능성 확인
      if (candidateChangeTime !== null) {
        const isBackToBaseline = calculateMaxChange(baselinePattern, sensors) <= STABILITY_THRESHOLD;
        
        if (isBackToBaseline) {
          // 원래 패턴으로 복귀 = 뒤척임이었음
          candidateChangeTime = null;
          confirmationCounter = 0;
        }
      }
    }
  }

  return lastConfirmedChange;
}

/**
 * 두 센서값 패턴의 최대 변화율 계산
 */
function calculateMaxChange(
  baselinePattern: Map<number, number>, 
  currentSensors: Map<number, number>
): number {
  let maxChange = 0;
  
  for (const [sensor, currentValue] of currentSensors) {
    const baseline = baselinePattern.get(sensor) || 0;
    if (baseline > 0) {
      const changeRatio = Math.abs(currentValue - baseline) / baseline;
      maxChange = Math.max(maxChange, changeRatio);
    }
  }
  
  return maxChange;
}

/**
 * 경고 상태 결정 (기존과 동일)
 */
export function decideWarningState(
  lastMove: Date | null,
  anchor: Date,
): number {
  // 한 번도 확정된 움직임이 감지되지 않은 경우
  if (!lastMove) {
    const diffMinutes = 120; // 최소 위험으로 간주
    return 2;
  }

  const diffMinutes = (anchor.getTime() - lastMove.getTime()) / 60000;

  if (diffMinutes >= 120) return 2; // 위험 (2시간 이상)
  if (diffMinutes >= 60) return 1;  // 경고 (1시간 이상)
  return 0;                          // 안정 (1시간 미만)
}