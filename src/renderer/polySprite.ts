/**
 * "PS2 era" 3D IT guy: realistic proportions, low vertex-count silhouettes, smooth (Gouraud-style) shading.
 * Same rig as the pixel sprites, but the pelvis is the pivot, limbs are long and the head is small.
 * The head is drawn in pixel-head space and scaled by POLY_HEAD_SCALE, so head accessories still fit.
 */

import { AccessoryId } from '../types/meme';
import { CharacterPose } from './danceEngine';

type Point = [number, number];

interface Shade {
  light: string;
  base: string;
  dark: string;
}

/** Head anchor (torso units) and scale; canvasRenderer uses these to aim the laser eyes */
export const POLY_HEAD_Y = -22.5;
export const POLY_HEAD_SCALE = 0.5;

const TEE: Shade = { light: '#5f6d70', base: '#3e4a4d', dark: '#232a2c' };
const JEANS: Shade = { light: '#5f86bd', base: '#3b5f94', dark: '#213a60' };
const SKIN: Shade = { light: '#f0c4a0', base: '#d6a07c', dark: '#a8734f' };
const HAIR: Shade = { light: '#4a3426', base: '#2e2018', dark: '#18110c' };
const SHOE: Shade = { light: '#4a4a52', base: '#2c2c32', dark: '#141418' };
const STUBBLE = 'rgba(55, 38, 28, 0.42)';

function path(ctx: CanvasRenderingContext2D, s: number, points: Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0][0] * s, points[0][1] * s);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * s, points[i][1] * s);
  ctx.closePath();
}

function flat(ctx: CanvasRenderingContext2D, s: number, points: Point[], color: string) {
  path(ctx, s, points);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Smooth shading lit from the upper left: a horizontal light → base → dark gradient across the shape */
function shaded(ctx: CanvasRenderingContext2D, s: number, points: Point[], shade: Shade, x0: number, x1: number) {
  const gradient = ctx.createLinearGradient(x0 * s, 0, x1 * s, 0);
  gradient.addColorStop(0, shade.light);
  gradient.addColorStop(0.45, shade.base);
  gradient.addColorStop(1, shade.dark);
  path(ctx, s, points);
  ctx.fillStyle = gradient;
  ctx.fill();
}

/** Tapered limb from y=0 to y=len with a slightly bulged middle (6 vertices, like a low-poly cylinder) */
function limb(ctx: CanvasRenderingContext2D, s: number, len: number, topW: number, bottomW: number, shade: Shade) {
  const t = topW / 2;
  const b = bottomW / 2;
  const m = Math.max(t, b) * 1.04;
  shaded(ctx, s, [[-t, 0], [t, 0], [m, len * 0.45], [b, len], [-b, len], [-m, len * 0.45]], shade, -m, m);
}

/** Soft contact shadow under the feet, grounding the figure like a 3D render */
export function renderPolyShadow(ctx: CanvasRenderingContext2D, s: number) {
  const gradient = ctx.createRadialGradient(0, 25.5 * s, 0, 0, 25.5 * s, 10 * s);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.scale(1, 0.22);
  ctx.translate(0, 25.5 * s * (1 / 0.22 - 1));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 25.5 * s, 10 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderLeg(ctx: CanvasRenderingContext2D, s: number, hipX: number, leg: CharacterPose['leftLeg'], toeDir: 1 | -1) {
  ctx.save();
  ctx.translate(hipX * s, 1.5 * s);
  ctx.rotate(leg.hipAngle);
  limb(ctx, s, 12.2, 4.6, 3.5, JEANS);
  // Outer seam and a faded thigh highlight
  flat(ctx, s, [[1.9 * toeDir, 0.5], [2.05 * toeDir, 0.5], [1.65 * toeDir, 12], [1.5 * toeDir, 12]], 'rgba(20, 35, 60, 0.45)');
  flat(ctx, s, [[-1.2, 2], [0.2, 2], [0, 8], [-1, 8]], 'rgba(170, 195, 230, 0.18)');

  ctx.translate(0, 11.8 * s);
  ctx.rotate(leg.kneeAngle);
  limb(ctx, s, 11.2, 3.5, 3, JEANS);
  // Knee crease and the slightly flared hem
  flat(ctx, s, [[-1.4, 0.4], [1.2, 0.8], [1.1, 1.2], [-1.4, 0.9]], 'rgba(15, 28, 50, 0.45)');
  flat(ctx, s, [[-1.7, 10], [1.7, 10], [1.8, 11.4], [-1.8, 11.4]], JEANS.dark);

  // Dark leather shoe: low-poly wedge, toe pointing outward
  const y = 11 + leg.footYOffset / s;
  const toe = 3.6 * toeDir;
  shaded(ctx, s, [[-1.6 * toeDir, y], [1.2 * toeDir, y], [toe, y + 1.2], [toe, y + 2.2], [-1.8 * toeDir, y + 2.2]], SHOE, -2, 3.6);
  flat(ctx, s, [[-1.8 * toeDir, y + 2], [toe, y + 2], [toe, y + 2.5], [-1.8 * toeDir, y + 2.5]], '#0c0c0e');
  ctx.restore();
}

export function renderPolyLegs(ctx: CanvasRenderingContext2D, pose: CharacterPose, s: number) {
  const shift = pose.pelvisShiftX * 0.3;
  renderLeg(ctx, s, -2.4 + shift, pose.leftLeg, -1);
  renderLeg(ctx, s, 2.4 + shift, pose.rightLeg, 1);
}

export function renderPolyTorso(ctx: CanvasRenderingContext2D, pose: CharacterPose, s: number) {
  const x = pose.pelvisShiftX * 0.5;

  // Jeans waist and seat, under the tee's hem
  shaded(ctx, s, [[x - 4.8, -1.5], [x + 4.8, -1.5], [x + 5, 2.5], [x + 1, 4], [x - 1, 4], [x - 5, 2.5]], JEANS, x - 5, x + 5);
  flat(ctx, s, [[x - 4.8, -0.6], [x + 4.8, -0.6], [x + 4.8, 0.2], [x - 4.8, 0.2]], '#1a2742');

  // Neck
  shaded(ctx, s, [[x - 1.6, -22.8], [x + 1.6, -22.8], [x + 1.8, -19.4], [x - 1.8, -19.4]], SKIN, x - 1.8, x + 1.8);
  flat(ctx, s, [[x - 1.6, -21], [x + 1.6, -21], [x + 1.8, -19.4], [x - 1.8, -19.4]], 'rgba(90, 55, 35, 0.35)');

  // Dark crew-neck tee: sloped shoulders, chest, tapering to an untucked hem
  shaded(ctx, s, [
    [x - 2, -20], [x + 2, -20], [x + 5.4, -19.2], [x + 6.4, -17.6], [x + 5.7, -13.5],
    [x + 4.7, -6], [x + 5, 0.4], [x - 5, 0.4], [x - 4.7, -6], [x - 5.7, -13.5], [x - 6.4, -17.6], [x - 5.4, -19.2]
  ], TEE, x - 6.4, x + 6.4);
  // Pec and side shadows, and the hem fold, for a bit of modelled volume
  flat(ctx, s, [[x - 4.6, -13.2], [x + 4.6, -13.2], [x + 4.2, -12.4], [x - 4.2, -12.4]], 'rgba(0, 0, 0, 0.18)');
  flat(ctx, s, [[x + 3.2, -12], [x + 5.4, -13], [x + 4.7, -6], [x + 4.9, 0.4], [x + 3, 0.4]], 'rgba(0, 0, 0, 0.18)');
  flat(ctx, s, [[x - 5, -0.4], [x + 5, -0.4], [x + 5, 0.4], [x - 5, 0.4]], 'rgba(0, 0, 0, 0.25)');
  // Ribbed collar
  flat(ctx, s, [[x - 2.2, -20.1], [x + 2.2, -20.1], [x + 1.5, -18.9], [x, -18.5], [x - 1.5, -18.9]], TEE.dark);
  flat(ctx, s, [[x - 1.5, -19.9], [x + 1.5, -19.9], [x + 1, -19.2], [x, -19], [x - 1, -19.2]], SKIN.dark);
}

function renderArm(ctx: CanvasRenderingContext2D, s: number, shoulderX: number, side: 1 | -1, arm: CharacterPose['leftArm'], accessory: AccessoryId, glowColor: string) {
  ctx.save();
  ctx.translate(shoulderX * s, -18.3 * s);
  ctx.rotate(arm.shoulderAngle);
  limb(ctx, s, 8.8, 2.9, 2.3, SKIN);
  // Short tee sleeve over the shoulder and biceps
  shaded(ctx, s, [[-1.9, -0.8], [1.9, -0.8], [2, 3.8], [1.6, 4.4], [-1.6, 4.4], [-2, 3.8]], TEE, -2, 2);
  flat(ctx, s, [[-1.7, 3.8], [1.7, 3.8], [1.6, 4.4], [-1.6, 4.4]], TEE.dark);

  ctx.translate(0, 8.4 * s);
  ctx.rotate(arm.elbowAngle);
  limb(ctx, s, 7.6, 2.3, 1.8, SKIN);
  // Mitten-style low-poly hand with a thumb facet
  shaded(ctx, s, [[-1, 7.4], [1, 7.4], [1.3, 8.8], [0.8, 10.2], [-0.8, 10.2], [-1.3, 8.8]], SKIN, -1.3, 1.3);
  flat(ctx, s, [[0.9 * side, 7.6], [1.6 * side, 8.4], [1.2 * side, 9.2]], SKIN.dark);

  if (accessory === 'glowsticks') {
    flat(ctx, s, [[-0.6, 8], [0.6, 8], [0.6, 17], [-0.6, 17]], glowColor);
  }
  ctx.restore();
}

export function renderPolyArms(ctx: CanvasRenderingContext2D, pose: CharacterPose, accessory: AccessoryId, s: number, glow: { left: string; right: string }) {
  const x = pose.pelvisShiftX * 0.5;
  renderArm(ctx, s, x - 6, -1, pose.leftArm, accessory, glow.left);
  renderArm(ctx, s, x + 6, 1, pose.rightArm, accessory, glow.right);
}

/** Drawn in pixel-head space (eyes near y=-5.5, x=±3); the caller scales it by POLY_HEAD_SCALE */
export function renderPolyHead(ctx: CanvasRenderingContext2D, pose: CharacterPose, s: number) {
  const h = pose.hairWhip * 0.3;

  // Ears
  shaded(ctx, s, [[-6.9, -8], [-6, -8.6], [-6, -3.4], [-6.6, -3.6], [-7.2, -5.6]], SKIN, -7.2, -6);
  shaded(ctx, s, [[6, -8.6], [6.9, -8], [7.2, -5.6], [6.6, -3.6], [6, -3.4]], SKIN, 6, 7.2);

  // Head: cheekbones, tapering jaw, squared chin
  shaded(ctx, s, [
    [-5, -13], [0, -14.4], [5, -13], [6.2, -8], [6, -4], [4.6, 0], [2.2, 2.8], [-2.2, 2.8], [-4.6, 0], [-6, -4], [-6.2, -8]
  ], SKIN, -6.2, 6.2);
  // Eye sockets, cheek plane and jaw shadow
  flat(ctx, s, [[-5.4, -7], [-0.9, -7.2], [-0.9, -4.8], [-5.2, -4.6]], 'rgba(110, 65, 40, 0.18)');
  flat(ctx, s, [[0.9, -7.2], [5.4, -7], [5.2, -4.6], [0.9, -4.8]], 'rgba(110, 65, 40, 0.24)');
  flat(ctx, s, [[3.2, -3], [6, -4], [4.6, 0], [2.2, 2.8], [1.4, 1]], 'rgba(90, 50, 30, 0.22)');

  // Stubble across jaw, chin and upper lip
  flat(ctx, s, [[-5.6, -2.6], [-3, -1.2], [-1.6, -1.6], [1.6, -1.6], [3, -1.2], [5.6, -2.6], [4.6, 0], [2.2, 2.8], [-2.2, 2.8], [-4.6, 0]], STUBBLE);

  // Brows, eyes (small and realistic), nose and mouth
  flat(ctx, s, [[-5, -7.9], [-1.3, -8.3], [-1.2, -7.4], [-4.9, -7.2]], HAIR.base);
  flat(ctx, s, [[1.3, -8.3], [5, -7.9], [4.9, -7.2], [1.2, -7.4]], HAIR.base);
  const look = Math.sin(Date.now() / 600) > 0 ? 0.25 : -0.25;
  for (const ex of [-3, 3]) {
    flat(ctx, s, [[ex - 1.6, -5.6], [ex, -6.3], [ex + 1.6, -5.6], [ex, -5]], '#eae4dc');
    flat(ctx, s, [[ex - 0.6 + look, -6.1], [ex + 0.6 + look, -6.1], [ex + 0.6 + look, -5.1], [ex - 0.6 + look, -5.1]], '#2a1d16');
  }
  flat(ctx, s, [[0, -5.6], [1.1, -2], [0.2, -1.6], [-0.9, -2]], 'rgba(120, 70, 45, 0.45)');
  flat(ctx, s, [[-0.9, -2], [0.9, -2], [0.7, -1.5], [-0.7, -1.5]], 'rgba(80, 40, 25, 0.5)');

  if (pose.mouthOpen) {
    flat(ctx, s, [[-1.8, -0.3], [1.8, -0.3], [1.3, 1.4], [-1.3, 1.4]], '#3b1512');
    flat(ctx, s, [[-1.4, -0.3], [1.4, -0.3], [1.3, 0.2], [-1.3, 0.2]], '#e9e2d8');
  } else {
    flat(ctx, s, [[-2, -0.1], [2, -0.1], [1.7, 0.5], [-1.7, 0.5]], '#7a4635');
  }

  // Short dark hair: low hairline, fuller on top, a little tousled
  shaded(ctx, s, [
    [-6.3 + h, -7.6], [-6.6 + h, -11], [-4.8 + h, -14.4], [-1.2 + h, -15.8], [3 + h, -15.6], [5.6 + h, -13.8],
    [6.6 + h, -10.6], [6.3 + h, -7.6], [5.4 + h, -10.4], [2.4 + h, -11.4], [-1.6 + h, -11.6], [-4.8 + h, -10.8]
  ], HAIR, -6.6, 6.6);
  flat(ctx, s, [[-2.4 + h, -15.4], [0.6 + h, -16.6], [1.8 + h, -15.4]], HAIR.light);
  flat(ctx, s, [[2.4 + h, -11.4], [4.4 + h, -12.8], [5.4 + h, -10.4]], HAIR.dark);

  if (pose.sweatDrop) {
    flat(ctx, s, [[-8.6, -10], [-7.8, -11.6], [-7, -10], [-7.8, -8.8]], '#7cb3f2');
    flat(ctx, s, [[7, -10], [7.8, -11.6], [8.6, -10], [7.8, -8.8]], '#7cb3f2');
  }
}
