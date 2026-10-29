/**
 * Five more dance moves. Same rig as danceEngine: limbs hang along +y, and canvas rotation is clockwise,
 * so a positive angle swings the left arm/leg outward and a negative one swings the right arm/leg outward.
 */

import { DanceMoveId } from '../types/meme';
import { CharacterPose } from './danceEngine';

export type ExtraDanceId = Extract<DanceMoveId, 'robot' | 'floss' | 'dab' | 'sprinkler' | 'running_man'>;

export const EXTRA_DANCE_IDS: readonly ExtraDanceId[] = ['robot', 'floss', 'dab', 'sprinkler', 'running_man'];

const HALF_PI = Math.PI / 2;
const STILL_LIMB = { hipAngle: 0, kneeAngle: 0, footYOffset: 0 };

function basePose(sunglassesY: number, isPanicMode: boolean): CharacterPose {
  return {
    bodyX: 0, bodyY: 0, scaleX: 1, rotation: 0,
    headX: 0, headY: 0, headAngle: 0, hairWhip: 0,
    sweatDrop: isPanicMode, mouthOpen: false,
    leftArm: { shoulderAngle: 0.15, elbowAngle: 0, handYOffset: 0 },
    rightArm: { shoulderAngle: -0.15, elbowAngle: 0, handYOffset: 0 },
    leftLeg: STILL_LIMB, rightLeg: STILL_LIMB,
    tieAngle: 0, pelvisShiftX: 0, sunglassesY, isSquatting: false
  };
}

/** Stiff, quantized pops: elbows locked at 90°, forearms flip on every 8th note, head ticks */
function robot(phase: number, base: CharacterPose, amp: number): CharacterPose {
  const step = Math.floor(phase * 8);
  const leftUp = step % 2 === 0;
  const tick = [0, 1, 0, -1][step % 4];
  return {
    ...base,
    bodyX: tick * 2 * amp,
    headX: tick * 1.5,
    headAngle: tick * 0.18,
    tieAngle: tick * 0.2,
    mouthOpen: step % 4 === 2,
    leftArm: { shoulderAngle: HALF_PI, elbowAngle: leftUp ? HALF_PI : -HALF_PI, handYOffset: 0 },
    rightArm: { shoulderAngle: -HALF_PI, elbowAngle: leftUp ? HALF_PI : -HALF_PI, handYOffset: 0 },
    leftLeg: { hipAngle: 0.12, kneeAngle: 0, footYOffset: 0 },
    rightLeg: { hipAngle: -0.12, kneeAngle: 0, footYOffset: 0 }
  };
}

/** Straight arms swing together one way while the hips swing the other, twice per bar */
function floss(t: number, base: CharacterPose, amp: number): CharacterPose {
  const swing = Math.sin(t * 2);
  const arm = swing * 0.75 * amp;
  return {
    ...base,
    bodyX: -swing * 2,
    bodyY: -Math.abs(Math.cos(t * 2)) * 2,
    rotation: swing * 0.08,
    headX: swing,
    hairWhip: swing * 2,
    tieAngle: -swing * 0.6,
    mouthOpen: swing > 0.3,
    pelvisShiftX: -swing * 6 * amp,
    leftArm: { shoulderAngle: arm, elbowAngle: 0, handYOffset: 0 },
    rightArm: { shoulderAngle: arm, elbowAngle: 0, handYOffset: 0 },
    leftLeg: { hipAngle: 0.15 + swing * 0.1, kneeAngle: 0.15, footYOffset: 0 },
    rightLeg: { hipAngle: -0.15 + swing * 0.1, kneeAngle: 0.15, footYOffset: 0 }
  };
}

/** Snap into a dab on beat 1, hold, then mirror it on beat 3 */
function dab(phase: number, base: CharacterPose, amp: number): CharacterPose {
  const beatPhase = (phase * 2) % 1;
  const hit = Math.max(0, 1 - beatPhase * 6); // little dip right on the snap
  return {
    ...base,
    scaleX: phase < 0.5 ? 1 : -1,
    bodyY: hit * 3 * amp,
    rotation: 0.12,
    headX: 1.5,
    headY: 3,
    headAngle: -0.35,
    hairWhip: -2,
    tieAngle: 0.5,
    mouthOpen: hit > 0,
    // Left arm bent across the face, right arm flung out and up
    leftArm: { shoulderAngle: -2, elbowAngle: -1.6, handYOffset: 0 },
    rightArm: { shoulderAngle: -2.4, elbowAngle: 0, handYOffset: 0 },
    leftLeg: { hipAngle: 0.28, kneeAngle: 0.1, footYOffset: 0 },
    rightLeg: { hipAngle: -0.28, kneeAngle: 0.1, footYOffset: 0 }
  };
}

/** One hand behind the head, the other arm ratchets out in clicks then whips back */
function sprinkler(phase: number, base: CharacterPose, amp: number): CharacterPose {
  const click = Math.floor(phase * 8) % 4;
  return {
    ...base,
    bodyY: (click % 2) * 1.5,
    rotation: -0.06 * click * amp,
    headAngle: -0.05 * click,
    hairWhip: click - 1.5,
    tieAngle: -0.15 * click,
    mouthOpen: click === 3,
    leftArm: { shoulderAngle: 2.6, elbowAngle: 1.9, handYOffset: 0 },
    rightArm: { shoulderAngle: -1.1 - click * 0.22 * amp, elbowAngle: 0, handYOffset: 0 },
    leftLeg: { hipAngle: 0.2, kneeAngle: 0.35, footYOffset: 0 },
    rightLeg: { hipAngle: -0.05, kneeAngle: 0, footYOffset: 0 }
  };
}

/** Knees pop up on alternating beats while the arms pump at the sides */
function runningMan(t: number, base: CharacterPose, amp: number): CharacterPose {
  const beat = Math.sin(t * 2);
  const leftLift = Math.max(0, beat) * amp;
  const rightLift = Math.max(0, -beat) * amp;
  return {
    ...base,
    bodyY: -Math.abs(beat) * 3,
    headY: -Math.abs(beat),
    hairWhip: -beat * 2,
    tieAngle: beat * 0.3,
    mouthOpen: Math.abs(beat) > 0.7,
    pelvisShiftX: beat * 2,
    leftArm: { shoulderAngle: 0.25 + beat * 0.3, elbowAngle: -1.6, handYOffset: 0 },
    rightArm: { shoulderAngle: -0.25 + beat * 0.3, elbowAngle: 1.6, handYOffset: 0 },
    // Knees lift outward (not across) so the step reads clearly in a front view
    leftLeg: { hipAngle: 1.2 * leftLift, kneeAngle: -1.9 * leftLift, footYOffset: 0 },
    rightLeg: { hipAngle: -1.2 * rightLift, kneeAngle: 1.9 * rightLift, footYOffset: 0 }
  };
}

export function isExtraDance(moveId: DanceMoveId): moveId is ExtraDanceId {
  return (EXTRA_DANCE_IDS as readonly DanceMoveId[]).includes(moveId);
}

export function computeExtraPose(moveId: ExtraDanceId, phase: number, sunglassesY: number, isPanicMode: boolean): CharacterPose {
  const t = phase * Math.PI * 2;
  const amp = isPanicMode ? 1.3 : 1;
  const base = basePose(sunglassesY, isPanicMode);
  switch (moveId) {
    case 'robot': return robot(phase, base, amp);
    case 'floss': return floss(t, base, amp);
    case 'dab': return dab(phase, base, amp);
    case 'sprinkler': return sprinkler(phase, base, amp);
    case 'running_man': return runningMan(t, base, amp);
  }
}
