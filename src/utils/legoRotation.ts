// src/utils/legoRotation.ts

export type RotationMatrix = [
  number, number, number, // a, b, c
  number, number, number, // d, e, f
  number, number, number  // g, h, i
];

// 3x3 matris-multiplikation (A * B)
export function multiplyMatrices(a: RotationMatrix, b: RotationMatrix): RotationMatrix {
  return [
    Math.round((a[0]*b[0] + a[1]*b[3] + a[2]*b[6]) * 1000) / 1000,
    Math.round((a[0]*b[1] + a[1]*b[4] + a[2]*b[7]) * 1000) / 1000,
    Math.round((a[0]*b[2] + a[1]*b[5] + a[2]*b[8]) * 1000) / 1000,

    Math.round((a[3]*b[0] + a[4]*b[3] + a[5]*b[6]) * 1000) / 1000,
    Math.round((a[3]*b[1] + a[4]*b[4] + a[5]*b[7]) * 1000) / 1000,
    Math.round((a[3]*b[2] + a[4]*b[5] + a[5]*b[8]) * 1000) / 1000,

    Math.round((a[6]*b[0] + a[7]*b[3] + a[8]*b[6]) * 1000) / 1000,
    Math.round((a[6]*b[1] + a[7]*b[4] + a[8]*b[7]) * 1000) / 1000,
    Math.round((a[6]*b[2] + a[7]*b[5] + a[8]*b[8]) * 1000) / 1000,
  ];
}

// 90 graders rotationer runt respektive axel
export const ROT_Y_90: RotationMatrix = [
  0, 0, 1,
  0, 1, 0,
 -1, 0, 0
];

export const ROT_X_90: RotationMatrix = [
  1,  0, 0,
  0,  0, -1,
  0,  1,  0
];

export const ROT_Z_90: RotationMatrix = [
  0, -1, 0,
  1,  0, 0,
  0,  0, 1
];

export function rotatePieceMatrix(
  currentRot: RotationMatrix | number[],
  axis: 'x' | 'y' | 'z',
  clockwise = true
): RotationMatrix {
  let baseMat: RotationMatrix;
  if (axis === 'y') baseMat = ROT_Y_90;
  else if (axis === 'x') baseMat = ROT_X_90;
  else baseMat = ROT_Z_90;

  // Om moturs, rotera 3 gånger medurs (270 grader)
  const times = clockwise ? 1 : 3;
  let result = (currentRot.length === 9 ? [...currentRot] : [1, 0, 0, 0, 1, 0, 0, 0, 1]) as RotationMatrix;
  for (let i = 0; i < times; i++) {
    result = multiplyMatrices(result, baseMat);
  }
  return result;
}
