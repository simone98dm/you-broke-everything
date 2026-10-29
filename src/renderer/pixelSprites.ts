/**
 * Pixel Art Character Sprites & Accessories
 * Renders crisp, authentic 8-bit / 16-bit retro characters to HTML5 Canvas.
 */

import { CharacterId, AccessoryId } from '../types/meme';
import { CharacterPose } from './danceEngine';
import { renderPolyLegs, renderPolyTorso, renderPolyArms, renderPolyHead, renderPolyShadow, POLY_HEAD_Y, POLY_HEAD_SCALE } from './polySprite';

// Colors palette
export const PALETTE = {
  black: '#0d0d0d',
  white: '#ffffff',
  skin: '#fcd0a1',
  skinShadow: '#e0a96d',
  hairDark: '#2c1810',
  hairLight: '#4a2e1b',
  tieRed: '#dc2626',
  shirtWhite: '#f8fafc',
  shirtShadow: '#cbd5e1',
  pantsNavy: '#1e3a8a',
  pantsShadow: '#172554',
  shoesBrown: '#78350f',

  // Froggy
  frogGreen: '#4ade80',
  frogGreenShadow: '#16a34a',
  frogBelly: '#bbf7d0',
  frogShorts: '#f97316',

  // Cat
  catFur: '#fb923c',
  catFurLight: '#ffedd5',
  catNose: '#f43f5e',
  catStripe: '#c2410c',

  // Stickman
  stickRed: '#ef4444',
  stickBlue: '#3b82f6',

  // Robot
  robotBeige: '#e2d9c8',
  robotBeigeShadow: '#baa892',
  robotScreen: '#022c22',
  robotGreenText: '#22c55e',
  robotMetal: '#64748b',

  // Accessories
  sunglassLens: '#111827',
  sunglassShine: '#60a5fa',
  sirenRed: '#ef4444',
  sirenOrange: '#fbbf24',
  glowPink: '#ec4899',
  glowCyan: '#06b6d4',
  partyYellow: '#fde047',
  partyPurple: '#a855f7'
};

/**
 * Draws a filled pixel rectangle on a scaled pixel grid
 */
export function drawPixel(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h));
}

/**
 * Draws the character on the canvas according to current pose & characterId
 */
export function renderCharacter(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  pose: CharacterPose,
  accessory: AccessoryId,
  centerX: number,
  centerY: number,
  scale: number
) {
  ctx.save();
  ctx.translate(centerX + pose.bodyX * scale, centerY + pose.bodyY * scale);
  ctx.scale(pose.scaleX, 1);

  // Render accessories behind character (e.g., flaming server)
  if (accessory === 'fire_server') {
    renderFlamingServer(ctx, -28 * scale, 0, scale);
  }

  const isPoly = charId === 'polyguy';

  // Draw Legs
  if (isPoly) {
    renderPolyShadow(ctx, scale);
    renderPolyLegs(ctx, pose, scale);
  }
  else renderLegs(ctx, charId, pose, scale);

  // Draw Torso
  ctx.save();
  ctx.rotate(pose.rotation);
  if (isPoly) renderPolyTorso(ctx, pose, scale);
  else renderTorso(ctx, charId, pose, scale);

  // Draw Necktie (with dynamic physics whip)
  if (charId === 'sysadmin') {
    renderNecktie(ctx, pose, scale);
  }

  // Draw Arms
  if (isPoly) renderPolyArms(ctx, pose, accessory, scale, { left: PALETTE.glowCyan, right: PALETTE.glowPink });
  else renderArms(ctx, charId, pose, accessory, scale);

  // Draw Head (the 3D guy has a realistic, smaller head higher up; accessories scale with it)
  ctx.save();
  ctx.translate(pose.headX * scale, (isPoly ? POLY_HEAD_Y : -18) * scale + pose.headY * scale);
  ctx.rotate(pose.headAngle);
  if (isPoly) {
    ctx.scale(POLY_HEAD_SCALE, POLY_HEAD_SCALE);
    renderPolyHead(ctx, pose, scale);
  } else {
    renderHead(ctx, charId, pose, scale);
  }

  // Draw Accessories on Head
  renderHeadAccessories(ctx, pose, accessory, scale);

  ctx.restore(); // Head
  ctx.restore(); // Torso

  ctx.restore(); // Character Base
}

/**
 * Renders Legs & Shoes
 */
function renderLegs(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  pose: CharacterPose,
  s: number
) {
  const pColor = charId === 'froggy' ? PALETTE.frogShorts :
                 charId === 'cat' ? PALETTE.catFur :
                 charId === 'serverbot' ? PALETTE.robotMetal :
                 PALETTE.pantsNavy;

  const shoeColor = charId === 'sysadmin' ? PALETTE.shoesBrown :
                    charId === 'froggy' ? PALETTE.frogGreenShadow :
                    charId === 'cat' ? PALETTE.catFurLight :
                    charId === 'serverbot' ? PALETTE.robotBeigeShadow :
                    PALETTE.black;

  // Left Leg
  ctx.save();
  ctx.translate((-4 + pose.pelvisShiftX * 0.3) * s, 8 * s);
  ctx.rotate(pose.leftLeg.hipAngle);
  // Thigh
  drawPixel(ctx, -2 * s, 0, 4 * s, 8 * s, pColor);
  // Shin & Foot
  ctx.translate(0, 7 * s);
  ctx.rotate(pose.leftLeg.kneeAngle);
  drawPixel(ctx, -2 * s, 0, 4 * s, 7 * s, pColor);
  drawPixel(ctx, -2 * s, 6 * s + pose.leftLeg.footYOffset, 6 * s, 3 * s, shoeColor);
  ctx.restore();

  // Right Leg
  ctx.save();
  ctx.translate((4 + pose.pelvisShiftX * 0.3) * s, 8 * s);
  ctx.rotate(pose.rightLeg.hipAngle);
  // Thigh
  drawPixel(ctx, -2 * s, 0, 4 * s, 8 * s, pColor);
  // Shin & Foot
  ctx.translate(0, 7 * s);
  ctx.rotate(pose.rightLeg.kneeAngle);
  drawPixel(ctx, -2 * s, 0, 4 * s, 7 * s, pColor);
  drawPixel(ctx, -4 * s, 6 * s + pose.rightLeg.footYOffset, 6 * s, 3 * s, shoeColor);
  ctx.restore();
}

/**
 * Renders Torso according to Character ID
 */
function renderTorso(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  pose: CharacterPose,
  s: number
) {
  const shift = pose.pelvisShiftX * 0.5;

  switch (charId) {
    case 'froggy':
      // Chubby lime-green belly with shorts
      drawPixel(ctx, (-9 + shift) * s, -10 * s, 18 * s, 14 * s, PALETTE.frogGreen);
      drawPixel(ctx, (-5 + shift) * s, -7 * s, 10 * s, 9 * s, PALETTE.frogBelly);
      // Orange shorts
      drawPixel(ctx, (-9 + shift) * s, 3 * s, 18 * s, 6 * s, PALETTE.frogShorts);
      // Pixel belt
      drawPixel(ctx, (-9 + shift) * s, 3 * s, 18 * s, 1.5 * s, PALETTE.black);
      break;

    case 'cat':
      // Cat body with white chest patch
      drawPixel(ctx, (-7 + shift) * s, -10 * s, 14 * s, 17 * s, PALETTE.catFur);
      drawPixel(ctx, (-4 + shift) * s, -6 * s, 8 * s, 11 * s, PALETTE.catFurLight);
      // Tiger stripes
      drawPixel(ctx, (-7 + shift) * s, -7 * s, 2 * s, 2 * s, PALETTE.catStripe);
      drawPixel(ctx, (5 + shift) * s, -7 * s, 2 * s, 2 * s, PALETTE.catStripe);
      drawPixel(ctx, (-7 + shift) * s, -2 * s, 2 * s, 2 * s, PALETTE.catStripe);
      drawPixel(ctx, (5 + shift) * s, -2 * s, 2 * s, 2 * s, PALETTE.catStripe);
      // Wagging tail behind
      renderCatTail(ctx, pose, s);
      break;

    case 'stickman':
      // Red meme shirt with "404"
      drawPixel(ctx, (-6 + shift) * s, -10 * s, 12 * s, 17 * s, PALETTE.stickRed);
      // 404 pixel text
      drawPixel(ctx, (-3 + shift) * s, -5 * s, 6 * s, 3 * s, PALETTE.white);
      drawPixel(ctx, (-1 + shift) * s, -5 * s, 2 * s, 3 * s, PALETTE.black);
      break;

    case 'serverbot':
      // Server rack chassis with LEDs and cooling vent
      drawPixel(ctx, (-9 + shift) * s, -11 * s, 18 * s, 18 * s, PALETTE.robotMetal);
      drawPixel(ctx, (-7 + shift) * s, -9 * s, 14 * s, 14 * s, PALETTE.robotBeigeShadow);
      // Blinking LEDs
      const ledTick = Math.floor(Date.now() / 200) % 3;
      drawPixel(ctx, (-5 + shift) * s, -7 * s, 2 * s, 2 * s, ledTick === 0 ? '#ef4444' : '#7f1d1d');
      drawPixel(ctx, (-2 + shift) * s, -7 * s, 2 * s, 2 * s, ledTick === 1 ? '#22c55e' : '#14532d');
      drawPixel(ctx, (1 + shift) * s, -7 * s, 2 * s, 2 * s, ledTick === 2 ? '#3b82f6' : '#1e3a8a');
      // Fan grill
      drawPixel(ctx, (-4 + shift) * s, -2 * s, 8 * s, 5 * s, PALETTE.black);
      drawPixel(ctx, (-2 + shift) * s, -1 * s, 4 * s, 3 * s, PALETTE.robotMetal);
      break;

    case 'sysadmin':
    default:
      // White collared dress shirt with pocket & pen
      drawPixel(ctx, (-7 + shift) * s, -10 * s, 14 * s, 17 * s, PALETTE.shirtWhite);
      // Collar
      drawPixel(ctx, (-4 + shift) * s, -10 * s, 3 * s, 2 * s, PALETTE.shirtShadow);
      drawPixel(ctx, (1 + shift) * s, -10 * s, 3 * s, 2 * s, PALETTE.shirtShadow);
      // Pocket
      drawPixel(ctx, (2 + shift) * s, -5 * s, 3 * s, 4 * s, PALETTE.shirtShadow);
      // Pen
      drawPixel(ctx, (3 + shift) * s, -7 * s, 1 * s, 3 * s, PALETTE.pantsNavy);
      // Belt
      drawPixel(ctx, (-7 + shift) * s, 6 * s, 14 * s, 2 * s, PALETTE.black);
      drawPixel(ctx, (-1 + shift) * s, 6 * s, 2 * s, 2 * s, PALETTE.partyYellow);
      break;
  }
}

/**
 * Renders Cat's tail with swishing physics
 */
function renderCatTail(ctx: CanvasRenderingContext2D, pose: CharacterPose, s: number) {
  ctx.save();
  ctx.translate(-7 * s, 5 * s);
  const tailSway = Math.sin(pose.tieAngle * 3) * 0.8;
  ctx.rotate(1.2 + tailSway);
  drawPixel(ctx, 0, 0, 3 * s, 12 * s, PALETTE.catFur);
  drawPixel(ctx, 0, 9 * s, 3 * s, 4 * s, PALETTE.catFurLight);
  ctx.restore();
}

/**
 * Renders Necktie with exaggerated wind/whipping physics
 */
function renderNecktie(ctx: CanvasRenderingContext2D, pose: CharacterPose, s: number) {
  ctx.save();
  ctx.translate(0, -9 * s);
  ctx.rotate(pose.tieAngle);

  // Tie knot
  drawPixel(ctx, -1.5 * s, 0, 3 * s, 2 * s, '#b91c1c');
  // Upper tie
  drawPixel(ctx, -1 * s, 2 * s, 2 * s, 5 * s, PALETTE.tieRed);
  // Lower tie
  drawPixel(ctx, -1.5 * s, 7 * s, 3 * s, 7 * s, PALETTE.tieRed);
  // Pointed tip
  drawPixel(ctx, -1 * s, 14 * s, 2 * s, 2 * s, PALETTE.tieRed);
  ctx.restore();
}

/**
 * Renders Arms (shoulder -> elbow -> hand)
 */
function renderArms(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  pose: CharacterPose,
  accessory: AccessoryId,
  s: number
) {
  const armColor = charId === 'froggy' ? PALETTE.frogGreen :
                   charId === 'cat' ? PALETTE.catFur :
                   charId === 'stickman' ? PALETTE.stickRed :
                   charId === 'serverbot' ? PALETTE.robotMetal :
                   PALETTE.shirtWhite;

  const handColor = charId === 'froggy' ? PALETTE.frogGreenShadow :
                    charId === 'cat' ? PALETTE.catFurLight :
                    charId === 'stickman' ? PALETTE.skin :
                    charId === 'serverbot' ? PALETTE.robotBeige :
                    PALETTE.skin;

  // Left Arm
  ctx.save();
  ctx.translate(-7 * s, -7 * s);
  ctx.rotate(pose.leftArm.shoulderAngle);
  // Upper arm
  drawPixel(ctx, -1.5 * s, 0, 3 * s, 7 * s, armColor);
  // Forearm & Hand
  ctx.translate(0, 6 * s);
  ctx.rotate(pose.leftArm.elbowAngle);
  drawPixel(ctx, -1.5 * s, 0, 3 * s, 7 * s, charId === 'sysadmin' ? PALETTE.skin : armColor);
  drawPixel(ctx, -2 * s, 6 * s, 4 * s, 3.5 * s, handColor);

  // Glowstick in left hand
  if (accessory === 'glowsticks') {
    drawPixel(ctx, -1 * s, 6 * s, 2 * s, 10 * s, PALETTE.glowCyan);
  }
  ctx.restore();

  // Right Arm
  ctx.save();
  ctx.translate(7 * s, -7 * s);
  ctx.rotate(pose.rightArm.shoulderAngle);
  // Upper arm
  drawPixel(ctx, -1.5 * s, 0, 3 * s, 7 * s, armColor);
  // Forearm & Hand
  ctx.translate(0, 6 * s);
  ctx.rotate(pose.rightArm.elbowAngle);
  drawPixel(ctx, -1.5 * s, 0, 3 * s, 7 * s, charId === 'sysadmin' ? PALETTE.skin : armColor);
  drawPixel(ctx, -2 * s, 6 * s, 4 * s, 3.5 * s, handColor);

  // Glowstick in right hand
  if (accessory === 'glowsticks') {
    drawPixel(ctx, -1 * s, 6 * s, 2 * s, 10 * s, PALETTE.glowPink);
  }
  ctx.restore();
}

/**
 * Renders Character Head & Facial Expressions
 */
function renderHead(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  pose: CharacterPose,
  s: number
) {
  switch (charId) {
    case 'froggy':
      // Big frog eyes protruding on top
      drawPixel(ctx, -10 * s, -14 * s, 7 * s, 7 * s, PALETTE.frogGreen);
      drawPixel(ctx, 3 * s, -14 * s, 7 * s, 7 * s, PALETTE.frogGreen);
      // Eyeballs
      drawPixel(ctx, -9 * s, -13 * s, 5 * s, 5 * s, PALETTE.white);
      drawPixel(ctx, 4 * s, -13 * s, 5 * s, 5 * s, PALETTE.white);
      // Horizontal pupils (classic frog)
      drawPixel(ctx, -8 * s, -11 * s, 3 * s, 2 * s, PALETTE.black);
      drawPixel(ctx, 5 * s, -11 * s, 3 * s, 2 * s, PALETTE.black);

      // Wide frog face
      drawPixel(ctx, -12 * s, -9 * s, 24 * s, 11 * s, PALETTE.frogGreen);
      drawPixel(ctx, -8 * s, -3 * s, 16 * s, 4 * s, PALETTE.frogBelly);

      // Comical wide grin / tongue
      if (pose.mouthOpen) {
        drawPixel(ctx, -7 * s, -2 * s, 14 * s, 4 * s, '#7f1d1d');
        drawPixel(ctx, -4 * s, -1 * s, 8 * s, 3 * s, '#ef4444');
      } else {
        drawPixel(ctx, -9 * s, -2 * s, 18 * s, 1.5 * s, PALETTE.black);
      }
      break;

    case 'cat':
      // Pointy cat ears
      drawPixel(ctx, -9 * s, -15 * s, 5 * s, 6 * s, PALETTE.catFur);
      drawPixel(ctx, 4 * s, -15 * s, 5 * s, 6 * s, PALETTE.catFur);
      drawPixel(ctx, -8 * s, -13 * s, 3 * s, 4 * s, PALETTE.catNose);
      drawPixel(ctx, 5 * s, -13 * s, 3 * s, 4 * s, PALETTE.catNose);

      // Head
      drawPixel(ctx, -10 * s, -10 * s, 20 * s, 12 * s, PALETTE.catFur);
      drawPixel(ctx, -6 * s, -4 * s, 12 * s, 6 * s, PALETTE.catFurLight);

      // Eyes
      drawPixel(ctx, -7 * s, -7 * s, 3 * s, 4 * s, PALETTE.black);
      drawPixel(ctx, 4 * s, -7 * s, 3 * s, 4 * s, PALETTE.black);
      drawPixel(ctx, -6 * s, -7 * s, 1.5 * s, 1.5 * s, PALETTE.white);
      drawPixel(ctx, 5 * s, -7 * s, 1.5 * s, 1.5 * s, PALETTE.white);

      // Nose & Whiskers
      drawPixel(ctx, -1 * s, -3 * s, 2 * s, 1.5 * s, PALETTE.catNose);
      // Whiskers
      drawPixel(ctx, -13 * s, -3 * s, 4 * s, 1 * s, PALETTE.black);
      drawPixel(ctx, 9 * s, -3 * s, 4 * s, 1 * s, PALETTE.black);
      break;

    case 'stickman':
      // Big derpy ball head
      drawPixel(ctx, -8 * s, -12 * s, 16 * s, 14 * s, PALETTE.skin);
      // Goofy misaligned eyes (classic 2000s meme derp)
      drawPixel(ctx, -6 * s, -9 * s, 5 * s, 5 * s, PALETTE.white);
      drawPixel(ctx, 1 * s, -10 * s, 6 * s, 6 * s, PALETTE.white);
      drawPixel(ctx, -4 * s, -8 * s, 2 * s, 2 * s, PALETTE.black);
      drawPixel(ctx, 4 * s, -7 * s, 2 * s, 2 * s, PALETTE.black);
      // Derp smile
      drawPixel(ctx, -4 * s, -2 * s, 9 * s, 2 * s, PALETTE.black);
      break;

    case 'serverbot':
      // Beige CRT monitor housing
      drawPixel(ctx, -11 * s, -13 * s, 22 * s, 15 * s, PALETTE.robotBeige);
      drawPixel(ctx, -12 * s, -12 * s, 24 * s, 13 * s, PALETTE.robotBeige);
      // Dark green phosphor CRT screen
      drawPixel(ctx, -9 * s, -11 * s, 18 * s, 11 * s, PALETTE.robotScreen);

      // Green text face on CRT screen (toggles between :3, >_<, and ERR)
      if (pose.mouthOpen) {
        // >_< Face
        drawPixel(ctx, -6 * s, -8 * s, 2 * s, 3 * s, PALETTE.robotGreenText);
        drawPixel(ctx, -5 * s, -7 * s, 2 * s, 1 * s, PALETTE.robotGreenText);
        drawPixel(ctx, 4 * s, -8 * s, 2 * s, 3 * s, PALETTE.robotGreenText);
        drawPixel(ctx, 3 * s, -7 * s, 2 * s, 1 * s, PALETTE.robotGreenText);
        drawPixel(ctx, -2 * s, -5 * s, 4 * s, 2 * s, PALETTE.robotGreenText);
      } else {
        // :3 Face
        drawPixel(ctx, -6 * s, -8 * s, 3 * s, 3 * s, PALETTE.robotGreenText);
        drawPixel(ctx, 3 * s, -8 * s, 3 * s, 3 * s, PALETTE.robotGreenText);
        drawPixel(ctx, -2 * s, -5 * s, 4 * s, 2 * s, PALETTE.robotGreenText);
      }
      break;

    case 'sysadmin':
    default:
      // Wild messy hair with flailing spikes
      const hairOffset = pose.hairWhip;
      drawPixel(ctx, (-9 + hairOffset) * s, -15 * s, 18 * s, 7 * s, PALETTE.hairDark);
      // Spiky tufts
      drawPixel(ctx, (-11 + hairOffset) * s, -17 * s, 4 * s, 4 * s, PALETTE.hairLight);
      drawPixel(ctx, (-4 + hairOffset) * s, -19 * s, 5 * s, 5 * s, PALETTE.hairDark);
      drawPixel(ctx, (4 + hairOffset) * s, -18 * s, 5 * s, 4 * s, PALETTE.hairLight);
      drawPixel(ctx, (8 + hairOffset) * s, -15 * s, 3 * s, 5 * s, PALETTE.hairDark);

      // Face block
      drawPixel(ctx, -8 * s, -10 * s, 16 * s, 12 * s, PALETTE.skin);
      drawPixel(ctx, -8 * s, 0, 16 * s, 2 * s, PALETTE.skinShadow);

      // Wide frantic eyes
      drawPixel(ctx, -6 * s, -8 * s, 5 * s, 5 * s, PALETTE.white);
      drawPixel(ctx, 1 * s, -8 * s, 5 * s, 5 * s, PALETTE.white);
      // Darting pupils
      const pupilShift = Math.sin(Date.now() / 150) > 0 ? 1 : -1;
      drawPixel(ctx, (-4 + pupilShift) * s, -7 * s, 2.5 * s, 2.5 * s, PALETTE.black);
      drawPixel(ctx, (3 + pupilShift) * s, -7 * s, 2.5 * s, 2.5 * s, PALETTE.black);

      // Screaming / singing mouth
      if (pose.mouthOpen) {
        drawPixel(ctx, -4 * s, -2 * s, 8 * s, 4 * s, '#7f1d1d');
        drawPixel(ctx, -3 * s, -2 * s, 6 * s, 1.5 * s, PALETTE.white); // Upper teeth
        drawPixel(ctx, -2 * s, 0, 4 * s, 2 * s, '#ef4444'); // Tongue
      } else {
        drawPixel(ctx, -4 * s, -1 * s, 8 * s, 2 * s, PALETTE.black);
      }

      // Flying sweat drops (panic)
      if (pose.sweatDrop) {
        drawPixel(ctx, -12 * s, -11 * s, 2 * s, 4 * s, '#60a5fa');
        drawPixel(ctx, 10 * s, -11 * s, 2 * s, 4 * s, '#60a5fa');
      }
      break;
  }
}

/**
 * Head Accessories: Sunglasses (Deal With It), Party Hat, Siren
 */
function renderHeadAccessories(
  ctx: CanvasRenderingContext2D,
  pose: CharacterPose,
  accessory: AccessoryId,
  s: number
) {
  // Deal With It Sunglasses (descends smoothly)
  if (accessory === 'sunglasses' || accessory === 'mlg_shades_blunt' || pose.sunglassesY > -45) {
    ctx.save();
    ctx.translate(0, (-7 + pose.sunglassesY) * s);
    // Dark frames
    drawPixel(ctx, -8 * s, 0, 16 * s, 4 * s, PALETTE.sunglassLens);
    drawPixel(ctx, -7 * s, 4 * s, 5 * s, 2 * s, PALETTE.sunglassLens);
    drawPixel(ctx, 2 * s, 4 * s, 5 * s, 2 * s, PALETTE.sunglassLens);
    // Specular diagonal glare (classic 8-bit meme shine)
    drawPixel(ctx, -6 * s, 1 * s, 1.5 * s, 1.5 * s, PALETTE.white);
    drawPixel(ctx, -5 * s, 2 * s, 1.5 * s, 1.5 * s, PALETTE.white);
    drawPixel(ctx, 3 * s, 1 * s, 1.5 * s, 1.5 * s, PALETTE.white);
    drawPixel(ctx, 4 * s, 2 * s, 1.5 * s, 1.5 * s, PALETTE.white);
    ctx.restore();
  }

  // MLG Lit Blunt / Joint in mouth with wafting smoke
  if (accessory === 'mlg_shades_blunt') {
    ctx.save();
    ctx.translate(3 * s, 0);
    ctx.rotate(0.25);
    // White/tan rolling paper
    drawPixel(ctx, 0, 0, 9 * s, 2 * s, '#fef3c7');
    // Brown filter tip
    drawPixel(ctx, -1 * s, 0, 2 * s, 2 * s, '#b45309');
    // Glowing cherry red/orange ember
    const emberColor = Math.sin(Date.now() / 80) > 0 ? '#ef4444' : '#f97316';
    drawPixel(ctx, 9 * s, 0, 2 * s, 2 * s, emberColor);
    drawPixel(ctx, 10 * s, 0.5 * s, 1 * s, 1 * s, '#facc15');

    // Wafting pixel smoke particles
    const t = Date.now() / 150;
    for (let sm = 1; sm <= 3; sm++) {
      const smokeX = (11 + sm * 4 + Math.sin(t + sm) * 3) * s;
      const smokeY = (-sm * 4 - Math.abs(Math.cos(t + sm)) * 2) * s;
      const smokeSize = (1.5 + sm * 0.8) * s;
      drawPixel(ctx, smokeX, smokeY, smokeSize, smokeSize, 'rgba(255, 255, 255, 0.6)');
    }
    ctx.restore();
  }

  // Party Hat
  if (accessory === 'party_hat') {
    ctx.save();
    ctx.translate(0, -14 * s);
    drawPixel(ctx, -5 * s, 0, 10 * s, 3 * s, PALETTE.partyYellow);
    drawPixel(ctx, -3.5 * s, -4 * s, 7 * s, 4 * s, PALETTE.partyPurple);
    drawPixel(ctx, -2 * s, -8 * s, 4 * s, 4 * s, PALETTE.partyYellow);
    drawPixel(ctx, -1 * s, -11 * s, 2 * s, 3 * s, PALETTE.partyPurple);
    // Top pompom
    drawPixel(ctx, -1.5 * s, -14 * s, 3 * s, 3 * s, '#ef4444');
    ctx.restore();
  }

  // Emergency Siren
  if (accessory === 'siren') {
    ctx.save();
    ctx.translate(0, -15 * s);
    const sirenTick = Math.floor(Date.now() / 120) % 2;
    // Siren base
    drawPixel(ctx, -4 * s, 0, 8 * s, 2 * s, PALETTE.black);
    // Siren dome
    drawPixel(ctx, -3 * s, -4 * s, 6 * s, 4 * s, sirenTick === 0 ? PALETTE.sirenRed : PALETTE.sirenOrange);
    // Light rays
    if (sirenTick === 0) {
      drawPixel(ctx, -8 * s, -5 * s, 4 * s, 2 * s, '#fef08a');
      drawPixel(ctx, 4 * s, -5 * s, 4 * s, 2 * s, '#fef08a');
    }
    ctx.restore();
  }
}

/**
 * MLG Fiery Red Eye Lasers
 * Shoots intense beams directly from character's eyes!
 */
export function renderLaserEyes(
  ctx: CanvasRenderingContext2D,
  headAbsX: number,
  headAbsY: number,
  headAngle: number,
  s: number,
  targetW: number,
  timeMs: number
) {
  ctx.save();
  ctx.translate(headAbsX, headAbsY);
  ctx.rotate(headAngle);

  // Eye coordinate offsets based on head
  const eyeLeft = { x: -3.5 * s, y: -6.5 * s };
  const eyeRight = { x: 3.5 * s, y: -6.5 * s };

  [eyeLeft, eyeRight].forEach((eye, idx) => {
    // Pulse width
    const beamW = 4 + Math.sin(timeMs * 0.05 + idx) * 2;
    const beamLength = targetW * 1.5;
    const beamAngle = 0.25 * (idx === 0 ? -1 : 1) + Math.sin(timeMs * 0.01) * 0.15;

    ctx.save();
    ctx.translate(eye.x, eye.y);
    ctx.rotate(beamAngle);

    // Outer red glow
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = beamW * 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(beamLength, 0);
    ctx.stroke();

    // Medium bright crimson laser
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = beamW * 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(beamLength, 0);
    ctx.stroke();

    // Inner blinding white/yellow core
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = Math.max(2, beamW * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(beamLength, 0);
    ctx.stroke();

    // Eye flare starburst at source
    drawPixel(ctx, -4, -4, 8, 8, '#ffffff');
    drawPixel(ctx, -6, -2, 12, 4, '#ef4444');
    drawPixel(ctx, -2, -6, 4, 12, '#ef4444');

    ctx.restore();
  });

  ctx.restore();
}

/**
 * MLG Doritos Nacho Cheese Bag (Pixel Art)
 */
export function renderDoritoBag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = scale;

  // Red/Orange Bag body
  drawPixel(ctx, -10 * s, -14 * s, 20 * s, 28 * s, '#dc2626');
  drawPixel(ctx, -9 * s, -13 * s, 18 * s, 26 * s, '#ea580c');

  // Top crimp foil
  drawPixel(ctx, -10 * s, -15 * s, 20 * s, 2 * s, '#facc15');
  // Bottom crimp foil
  drawPixel(ctx, -10 * s, 14 * s, 20 * s, 2 * s, '#facc15');

  // Triangular Dorito chip graphic on bag
  drawPixel(ctx, -4 * s, -3 * s, 8 * s, 2 * s, '#fde047');
  drawPixel(ctx, -3 * s, -1 * s, 6 * s, 2 * s, '#facc15');
  drawPixel(ctx, -2 * s, 1 * s, 4 * s, 2 * s, '#eab308');
  drawPixel(ctx, -1 * s, 3 * s, 2 * s, 2 * s, '#ca8a04');

  // "DORITOS" text simulation block
  drawPixel(ctx, -7 * s, -8 * s, 14 * s, 3 * s, '#ffffff');
  drawPixel(ctx, -6 * s, -7 * s, 12 * s, 1.5 * s, '#000000');

  ctx.restore();
}

/**
 * MLG Mountain Dew Can (Pixel Art)
 */
export function renderMountainDewCan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = scale;

  // Silver can top & bottom
  drawPixel(ctx, -7 * s, -14 * s, 14 * s, 3 * s, '#cbd5e1');
  drawPixel(ctx, -7 * s, 12 * s, 14 * s, 3 * s, '#cbd5e1');

  // Neon green cylinder body
  drawPixel(ctx, -8 * s, -11 * s, 16 * s, 23 * s, '#22c55e');
  drawPixel(ctx, -6 * s, -11 * s, 12 * s, 23 * s, '#4ade80');

  // Red & White jagged Mtn Dew banner
  drawPixel(ctx, -7 * s, -5 * s, 14 * s, 8 * s, '#ef4444');
  drawPixel(ctx, -5 * s, -4 * s, 10 * s, 6 * s, '#ffffff');
  drawPixel(ctx, -4 * s, -3 * s, 8 * s, 4 * s, '#15803d');

  ctx.restore();
}

/**
 * MLG Sniper Hitmarker (Diagonal X)
 */
export function renderHitmarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  const len = size * 0.7;
  const gap = size * 0.25;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'square';

  // 4 diagonal branches
  ctx.beginPath();
  // Top-left
  ctx.moveTo(-gap, -gap);
  ctx.lineTo(-len, -len);
  // Top-right
  ctx.moveTo(gap, -gap);
  ctx.lineTo(len, -len);
  // Bottom-left
  ctx.moveTo(-gap, gap);
  ctx.lineTo(-len, len);
  // Bottom-right
  ctx.moveTo(gap, gap);
  ctx.lineTo(len, len);
  ctx.stroke();

  ctx.restore();
}

/**
 * MLG Illuminati All-Seeing Eye Pyramid (Pixel Art)
 */
export function renderIlluminatiPyramid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number,
  timeMs: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = scale;

  // Radiant green/gold halo
  const haloTicks = 8;
  for (let i = 0; i < haloTicks; i++) {
    const a = (i / haloTicks) * Math.PI * 2 + timeMs * 0.003;
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 16 * s, Math.sin(a) * 16 * s);
    ctx.lineTo(Math.cos(a) * 26 * s, Math.sin(a) * 26 * s);
    ctx.stroke();
  }

  // Green Pyramid Triangle
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(0, -18 * s);
  ctx.lineTo(16 * s, 14 * s);
  ctx.lineTo(-16 * s, 14 * s);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  // Brick lines
  for (let b = -8; b <= 10; b += 6) {
    drawPixel(ctx, (-10 + Math.abs(b) * 0.4) * s, b * s, (20 - Math.abs(b) * 0.8) * s, 1.5 * s, '#166534');
  }

  // The All-Seeing Eye in upper triangle
  drawPixel(ctx, -5 * s, -6 * s, 10 * s, 6 * s, '#ffffff');
  drawPixel(ctx, -2 * s, -5 * s, 4 * s, 4 * s, '#000000');
  drawPixel(ctx, -1 * s, -4 * s, 2 * s, 2 * s, '#4ade80'); // Green pupil

  ctx.restore();
}

/**
 * MLG Sniper Crosshair 360 Reticle
 */
export function renderSniperCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Outer red circle
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(-radius * 1.3, 0);
  ctx.lineTo(-radius * 0.3, 0);
  ctx.moveTo(radius * 0.3, 0);
  ctx.lineTo(radius * 1.3, 0);
  ctx.moveTo(0, -radius * 1.3);
  ctx.lineTo(0, -radius * 0.3);
  ctx.moveTo(0, radius * 0.3);
  ctx.lineTo(0, radius * 1.3);
  ctx.stroke();

  // Center pip
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-2, -2, 4, 4);

  ctx.restore();
}

/**
 * Flaming Server Rack Prop
 */
function renderFlamingServer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Server rack frame
  drawPixel(ctx, -8 * s, -16 * s, 16 * s, 32 * s, '#1e293b');
  drawPixel(ctx, -7 * s, -15 * s, 14 * s, 30 * s, '#0f172a');

  // Hard drives / servers inside
  for (let i = 0; i < 4; i++) {
    const rowY = (-14 + i * 7) * s;
    drawPixel(ctx, -6 * s, rowY, 12 * s, 5 * s, '#334155');
    drawPixel(ctx, -4 * s, rowY + 1 * s, 3 * s, 1.5 * s, '#22c55e');
    drawPixel(ctx, 0, rowY + 1 * s, 3 * s, 1.5 * s, '#ef4444');
  }

  // 8-bit Flames erupting from top
  const flameStep = Math.floor(Date.now() / 100) % 4;
  const fOffset = flameStep % 2 === 0 ? 1 : -1;
  drawPixel(ctx, (-6 + fOffset) * s, -22 * s, 12 * s, 7 * s, '#ef4444');
  drawPixel(ctx, (-4 + fOffset) * s, -25 * s, 8 * s, 5 * s, '#f97316');
  drawPixel(ctx, (-2 + fOffset) * s, -28 * s, 4 * s, 4 * s, '#facc15');

  ctx.restore();
}

