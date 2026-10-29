/**
 * Dance Kinematics & Posture Engine
 * Computes exact joint coordinates, angles, and bounces for each frame of animation.
 */

import { DanceMoveId } from '../types/meme';
import { computeExtraPose, isExtraDance } from './extraDances';

export interface CharacterPose {
  // Base offsets
  bodyX: number;
  bodyY: number;
  scaleX: number; // For flip/spin
  rotation: number; // Torso tilt in radians

  // Head
  headX: number;
  headY: number;
  headAngle: number;
  hairWhip: number; // Hair offset in px
  sweatDrop: boolean;
  mouthOpen: boolean;

  // Left Arm (shoulder -> elbow -> hand)
  leftArm: {
    shoulderAngle: number;
    elbowAngle: number;
    handYOffset: number;
  };

  // Right Arm (shoulder -> elbow -> hand)
  rightArm: {
    shoulderAngle: number;
    elbowAngle: number;
    handYOffset: number;
  };

  // Left Leg (hip -> knee -> foot)
  leftLeg: {
    hipAngle: number;
    kneeAngle: number;
    footYOffset: number;
  };

  // Right Leg (hip -> knee -> foot)
  rightLeg: {
    hipAngle: number;
    kneeAngle: number;
    footYOffset: number;
  };

  // Extra accessories & props
  tieAngle: number;
  pelvisShiftX: number;
  sunglassesY: number; // 0 = fully on face, -40 = above screen
  isSquatting: boolean;
}

export function computePose(
  moveId: DanceMoveId,
  phase: number, // 0.0 to 1.0 (one full 4-beat measure)
  glassesDropped: boolean,
  isPanicMode: boolean
): CharacterPose {
  const t = phase * Math.PI * 2; // Full circle 0 to 2PI
  const tDouble = phase * Math.PI * 4; // Double time (8th notes)

  const panicBonus = isPanicMode ? 1.4 : 1.0;

  // Default sunglasses position
  const sunglassesY = glassesDropped ? 0 : -50;

  if (isExtraDance(moveId)) return computeExtraPose(moveId, phase, sunglassesY, isPanicMode);

  switch (moveId) {
    case 'caramell': {
      // Hands up beside the head flapping like ears, hips swaying side to side, a small hop on every beat.
      // Rig note: a limb hangs along +y and rotation is clockwise, so positive = left arm/leg outward.
      const bounce = Math.abs(Math.sin(tDouble)) * 4 * panicBonus;
      const sway = Math.sin(t) * 6 * panicBonus;
      const tilt = Math.sin(t) * 0.12;
      const flap = Math.sin(tDouble * 2) * 0.25; // wrists flick twice per beat
      const stepL = Math.sin(t) > 0;

      return {
        bodyX: sway,
        bodyY: -bounce,
        scaleX: 1,
        rotation: tilt,

        headX: 0,
        headY: -1,
        headAngle: -tilt,
        hairWhip: -sway * 0.4,
        sweatDrop: isPanicMode,
        mouthOpen: Math.sin(tDouble) > 0,

        // Upper arms raised out to the sides, forearms angled up and in beside the head ("ears")
        leftArm: {
          shoulderAngle: 2.5,
          elbowAngle: 0.9 + flap,
          handYOffset: 0
        },
        rightArm: {
          shoulderAngle: -2.5,
          elbowAngle: -0.9 - flap,
          handYOffset: 0
        },

        // Feet stay under the hips, knees bend alternately with the sway
        leftLeg: {
          hipAngle: 0.08 + Math.sin(t) * 0.12,
          kneeAngle: stepL ? 0.35 : 0.05,
          footYOffset: stepL ? -2 : 0
        },
        rightLeg: {
          hipAngle: -0.08 + Math.sin(t) * 0.12,
          kneeAngle: stepL ? 0.05 : 0.35,
          footYOffset: stepL ? 0 : -2
        },

        tieAngle: -sway * 0.12,
        pelvisShiftX: sway * 0.8,
        sunglassesY,
        isSquatting: false
      };
    }

    case 'russian': {
      // Deep squat with arms crossed, kicking legs straight out left & right
      const squatPhase = Math.sin(tDouble);
      const isLeftKick = Math.sin(t) > 0;
      const kickProgress = Math.abs(Math.sin(t));

      return {
        bodyX: 0,
        bodyY: 9 - Math.abs(squatPhase) * 3,
        scaleX: 1,
        rotation: (isLeftKick ? -0.1 : 0.1) * kickProgress,

        headX: 0,
        headY: 9 - Math.abs(squatPhase) * 3,
        headAngle: (isLeftKick ? 0.1 : -0.1) * kickProgress,
        hairWhip: (isLeftKick ? -2 : 2),
        sweatDrop: isPanicMode,
        mouthOpen: true,

        // Arms folded across chest
        leftArm: {
          shoulderAngle: -0.8,
          elbowAngle: 1.8,
          handYOffset: 0
        },
        rightArm: {
          shoulderAngle: 0.8,
          elbowAngle: -1.8,
          handYOffset: 0
        },

        // Alternate straight leg kicks
        leftLeg: {
          hipAngle: isLeftKick ? -1.35 * kickProgress : 0.9,
          kneeAngle: isLeftKick ? 0.05 : 1.7, // Straight leg kick vs deep squat
          footYOffset: isLeftKick ? -8 * kickProgress : 4
        },
        rightLeg: {
          hipAngle: !isLeftKick ? 1.35 * kickProgress : -0.9,
          kneeAngle: !isLeftKick ? 0.05 : 1.7,
          footYOffset: !isLeftKick ? -8 * kickProgress : 4
        },

        tieAngle: isLeftKick ? 0.5 : -0.5,
        pelvisShiftX: 0,
        sunglassesY,
        isSquatting: true
      };
    }

    case 'disco': {
      // Exaggerated Saturday Night Fever point & pelvic thrust
      const beatNum = Math.floor(phase * 4); // 0, 1, 2, 3
      const isRightPoint = beatNum < 2;
      const bounce = Math.abs(Math.sin(tDouble)) * 4;
      const thrust = isRightPoint ? 7 : -7;

      return {
        bodyX: thrust * 0.5,
        bodyY: -bounce,
        scaleX: 1,
        rotation: isRightPoint ? 0.2 : -0.2,

        headX: thrust * 0.3,
        headY: -bounce,
        headAngle: isRightPoint ? 0.25 : -0.25,
        hairWhip: isRightPoint ? 3 : -3,
        sweatDrop: false,
        mouthOpen: beatNum % 2 === 1,

        // One arm pointing up high, other hand on hip
        leftArm: isRightPoint
          ? { shoulderAngle: 0.6, elbowAngle: 1.4, handYOffset: 0 } // hand on hip
          : { shoulderAngle: -2.5, elbowAngle: 0.1, handYOffset: -12 }, // pointing to sky!
        rightArm: isRightPoint
          ? { shoulderAngle: 2.5, elbowAngle: -0.1, handYOffset: -12 } // pointing to sky!
          : { shoulderAngle: -0.6, elbowAngle: -1.4, handYOffset: 0 }, // hand on hip

        leftLeg: {
          hipAngle: isRightPoint ? 0.4 : -0.2,
          kneeAngle: isRightPoint ? 0.6 : 0.2,
          footYOffset: isRightPoint ? -2 : 0
        },
        rightLeg: {
          hipAngle: isRightPoint ? -0.2 : -0.4,
          kneeAngle: isRightPoint ? 0.2 : 0.6,
          footYOffset: isRightPoint ? 0 : -2
        },

        tieAngle: isRightPoint ? -0.4 : 0.4,
        pelvisShiftX: thrust,
        sunglassesY,
        isSquatting: false
      };
    }

    case 'headbang': {
      // Double time violent headbanging with devil horns pump
      const headbangCycle = Math.sin(tDouble * 2);
      const isHeadDown = headbangCycle > 0;
      const torsoHinge = headbangCycle * 0.65 * panicBonus;

      return {
        bodyX: 0,
        bodyY: Math.abs(headbangCycle) * 3,
        scaleX: 1,
        rotation: torsoHinge,

        headX: 0,
        headY: isHeadDown ? 7 : -3,
        headAngle: torsoHinge * 1.5,
        hairWhip: -headbangCycle * 9,
        sweatDrop: true,
        mouthOpen: true,

        // Double fists / horns pumping in the air
        leftArm: {
          shoulderAngle: -2.4 + Math.sin(tDouble) * 0.5,
          elbowAngle: 0.8 + Math.cos(tDouble) * 0.4,
          handYOffset: -6
        },
        rightArm: {
          shoulderAngle: 2.4 - Math.sin(tDouble) * 0.5,
          elbowAngle: -0.8 - Math.cos(tDouble) * 0.4,
          handYOffset: -6
        },

        // Wide power stance
        leftLeg: {
          hipAngle: -0.4,
          kneeAngle: 0.5,
          footYOffset: 0
        },
        rightLeg: {
          hipAngle: 0.4,
          kneeAngle: 0.5,
          footYOffset: 0
        },

        tieAngle: headbangCycle * 0.9,
        pelvisShiftX: 0,
        sunglassesY,
        isSquatting: false
      };
    }

    case 'noodle':
    default: {
      // The classic ridiculous flailing noodle dance: crazy waving rubber arms,
      // body rocking, Charleston knees
      const sway = Math.sin(t) * 8 * panicBonus;
      const bounce = Math.abs(Math.sin(tDouble)) * 5;
      const tilt = Math.sin(t) * 0.3 * panicBonus;

      const waveL = Math.sin(tDouble) * 0.9;
      const waveR = Math.cos(tDouble) * 0.9;

      return {
        bodyX: sway,
        bodyY: -bounce,
        scaleX: 1,
        rotation: tilt,

        headX: sway * 0.8,
        headY: -bounce - 1,
        headAngle: -tilt * 1.2,
        hairWhip: -sway * 0.7,
        sweatDrop: isPanicMode || phase > 0.5,
        mouthOpen: Math.sin(tDouble) > -0.2,

        // High flailing rubber noodle arms whipping above head
        leftArm: {
          shoulderAngle: -2.1 + waveL,
          elbowAngle: 1.2 + Math.sin(t * 3) * 0.8,
          handYOffset: -4
        },
        rightArm: {
          shoulderAngle: 2.1 + waveR,
          elbowAngle: -1.2 - Math.cos(t * 3) * 0.8,
          handYOffset: -4
        },

        // Charleston knee twist
        leftLeg: {
          hipAngle: Math.sin(t) * 0.5,
          kneeAngle: 0.4 + Math.abs(Math.sin(tDouble)) * 0.6,
          footYOffset: Math.sin(t) > 0 ? -3 : 0
        },
        rightLeg: {
          hipAngle: -Math.sin(t) * 0.5,
          kneeAngle: 0.4 + Math.abs(Math.cos(tDouble)) * 0.6,
          footYOffset: Math.sin(t) <= 0 ? -3 : 0
        },

        tieAngle: -sway * 0.25 + Math.sin(tDouble) * 0.4,
        pelvisShiftX: sway * 1.2,
        sunglassesY,
        isSquatting: false
      };
    }
  }
}
