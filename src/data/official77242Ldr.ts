/**
 * Official LEGO Speed Champions Ferrari SF-24 (Set #77242) LDraw Model Definition
 * 
 * Key Coordinate Truths:
 * - Wheelbase: 280.0 LDU (Front Axle Z = -140.0, Rear Axle Z = +140.0)
 * - Wheel Mounts: Tire at X = ±60.0 LDU, Hub/Rim at X = ±61.0 LDU, Aero Dish (#112498) at X = ±72.5 LDU
 * - Front Wing Outwash Corner (#2420): Mounted at X = ±76.0, Y = -12.0, Z = -210.0 LDU
 * - SNOT Brackets (#99207): Located at X = ±38.0 LDU with rotation matrix [0, -1, 0, 1, 0, 0, 0, 0, 1]
 * - SNOT Sidepod Panels (#11477, #93606): Mounted at X = ±48.0 LDU
 * - Cockpit & Halo (#100745): Center pillar at Z = -10.0, Y = -24.0, Driver Helmet (#112033) at Z = 0.0, Y = -36.0
 * - Rear Wing Endplates (#87079): Mounted at X = ±60.0, Y = -46.0, Z = 195.0 (Smooth Studless Tiles)
 * 
 * Coordinate System:
 * - LDraw: -Y is UPWARDS, +Y is DOWNWARDS. (Three.js transform applies position.y = -ldraw_y)
 */

export const OFFICIAL_77242_LDR: string = `0 Ferrari SF-24 - LEGO Speed Champions #77242
0 Name: 77242.ldr
0 Author: Official LEGO Speed Champions Master Builder Model
0 !LDRAW_ORG Model
0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt
0 BFC CERTIFY CCW
0 !COLOUR Black CODE 0 VALUE #1B2A34 EDGE #000000
0 !COLOUR Red CODE 4 VALUE #C91A09 EDGE #640000
0 !COLOUR Dark_Grey CODE 72 VALUE #646464 EDGE #333333
0 !COLOUR Light_Grey CODE 71 VALUE #969696 EDGE #555555
0 !COLOUR Yellow CODE 14 VALUE #F2CD37 EDGE #886600
0 !COLOUR White CODE 15 VALUE #FFFFFF EDGE #AAAAAA
0 !COLOUR Rubber_Black CODE 256 VALUE #1B2A34 EDGE #000000
0 // Total Pieces: 275
0 // Wheelbase: 280.0 LDU (Front Z=-140, Rear Z=+140)

0 STEP
0 // STEP 1: Floor & Undertray Venturi Tunnels (Lowest Surface at Y = 0)
1 0 0.0 -8.0 0.0 1 0 0 0 1 0 0 0 1 30029.dat
1 72 -30.0 -8.0 15.0 1 0 0 0 1 0 0 0 1 3034.dat
1 72 30.0 -8.0 15.0 1 0 0 0 1 0 0 0 1 3034.dat
1 0 -20.0 -8.0 20.0 1 0 0 0 1 0 0 0 1 3032.dat
1 0 20.0 -8.0 20.0 1 0 0 0 1 0 0 0 1 3032.dat
1 0 -30.0 -8.0 -80.0 1 0 0 0 1 0 0 0 1 3795.dat
1 0 30.0 -8.0 -80.0 1 0 0 0 1 0 0 0 1 3795.dat
1 0 -20.0 -8.0 110.0 1 0 0 0 1 0 0 0 1 3020.dat
1 0 20.0 -8.0 110.0 1 0 0 0 1 0 0 0 1 3020.dat
1 72 -20.0 -8.0 150.0 1 0 0 0 1 0 0 0 1 3020.dat
1 72 20.0 -8.0 150.0 1 0 0 0 1 0 0 0 1 3020.dat
1 0 0.0 -8.0 170.0 1 0 0 0 1 0 0 0 1 3710.dat

0 STEP
0 // STEP 2: Chassis Monocoque & SNOT Brackets
1 72 0.0 -16.0 -20.0 1 0 0 0 1 0 0 0 1 3020.dat
1 72 0.0 -16.0 40.0 1 0 0 0 1 0 0 0 1 3020.dat
1 0 -38.0 -8.0 -40.0 0 1 0 -1 0 0 0 0 1 99207.dat
1 0 38.0 -8.0 -40.0 0 -1 0 1 0 0 0 0 1 99207.dat
1 0 -38.0 -8.0 0.0 0 1 0 -1 0 0 0 0 1 99207.dat
1 0 38.0 -8.0 0.0 0 -1 0 1 0 0 0 0 1 99207.dat
1 0 -38.0 -8.0 40.0 0 1 0 -1 0 0 0 0 1 99207.dat
1 0 38.0 -8.0 40.0 0 -1 0 1 0 0 0 0 1 99207.dat
1 72 0.0 -16.0 -80.0 1 0 0 0 1 0 0 0 1 3710.dat
1 72 0.0 -16.0 -120.0 1 0 0 0 1 0 0 0 1 3710.dat
1 72 0.0 -16.0 80.0 1 0 0 0 1 0 0 0 1 3710.dat
1 72 0.0 -16.0 120.0 1 0 0 0 1 0 0 0 1 3710.dat

0 STEP
0 // STEP 3: Cockpit Cell & Driver Helmet
1 0 0.0 -16.0 10.0 1 0 0 0 1 0 0 0 1 4079b.dat
1 0 0.0 -24.0 -35.0 1 0 0 0 1 0 0 0 1 4592c02.dat
1 4 0.0 -36.0 0.0 1 0 0 0 1 0 0 0 1 112033.dat
1 0 -20.0 -16.0 -10.0 1 0 0 0 1 0 0 0 1 3024.dat
1 0 20.0 -16.0 -10.0 1 0 0 0 1 0 0 0 1 3024.dat

0 STEP
0 // STEP 4: Stepped Nose Cone & Front Bulkhead
1 4 0.0 -16.0 -150.0 1 0 0 0 1 0 0 0 1 15068.dat
1 4 0.0 -16.0 -185.0 1 0 0 0 1 0 0 0 1 11477.dat
1 4 -15.0 -16.0 -140.0 1 0 0 0 1 0 0 0 1 29119.dat
1 4 15.0 -16.0 -140.0 1 0 0 0 1 0 0 0 1 29120.dat
1 4 0.0 -16.0 -115.0 1 0 0 0 1 0 0 0 1 3068b.dat
1 14 0.0 -17.0 -115.0 1 0 0 0 1 0 0 0 1 2412b.dat

0 STEP
0 // STEP 5: Front Wing Aerofoil & Outwash Corners
1 0 0.0 -8.0 -210.0 1 0 0 0 1 0 0 0 1 3710.dat
1 0 -35.0 -8.0 -210.0 1 0 0 0 1 0 0 0 1 112499.dat
1 0 35.0 -8.0 -210.0 1 0 0 0 1 0 0 0 1 112499.dat
1 4 -76.0 -12.0 -210.0 1 0 0 0 1 0 0 0 1 2420.dat
1 4 76.0 -12.0 -210.0 1 0 0 0 1 0 0 0 1 2420.dat
1 0 -50.0 -12.0 -210.0 1 0 0 0 1 0 0 0 1 3024.dat
1 0 50.0 -12.0 -210.0 1 0 0 0 1 0 0 0 1 3024.dat
1 0 0.0 -12.0 -215.0 1 0 0 0 1 0 0 0 1 3024.dat

0 STEP
0 // STEP 6: Halo Titanium Roll-Protection & Mirrors
1 0 0.0 -24.0 -10.0 1 0 0 0 1 0 0 0 1 100745.dat
1 4 -32.0 -28.0 -35.0 1 0 0 0 1 0 0 0 1 80179.dat
1 4 32.0 -28.0 -35.0 1 0 0 0 1 0 0 0 1 80179.dat

0 STEP
0 // STEP 7: Sidepod Downwash Channels & SNOT Bodywork (Stage 3)
1 0 -48.0 -8.0 0.0 0 1 0 -1 0 0 0 0 1 2431.dat
1 0 48.0 -8.0 0.0 0 -1 0 1 0 0 0 0 1 2431.dat
1 0 -48.0 -8.0 40.0 0 1 0 -1 0 0 0 0 1 3069b.dat
1 0 48.0 -8.0 40.0 0 -1 0 1 0 0 0 0 1 3069b.dat
1 4 -48.0 -16.0 -20.0 0 1 0 -1 0 0 0 0 1 93606.dat
1 4 48.0 -16.0 -20.0 0 -1 0 1 0 0 0 0 1 93606.dat
1 4 -48.0 -16.0 20.0 0 1 0 -1 0 0 0 0 1 93606.dat
1 4 48.0 -16.0 20.0 0 -1 0 1 0 0 0 0 1 93606.dat
1 4 -48.0 -16.0 60.0 0 1 0 -1 0 0 0 0 1 11477.dat
1 4 48.0 -16.0 60.0 0 -1 0 1 0 0 0 0 1 11477.dat
1 0 -30.0 -24.0 -45.0 1 0 0 0 1 0 0 0 1 2412b.dat
1 0 30.0 -24.0 -45.0 1 0 0 0 1 0 0 0 1 2412b.dat

0 STEP
0 // STEP 8: Engine Cover & Turbo Airbox
1 4 0.0 -32.0 45.0 1 0 0 0 1 0 0 0 1 15068.dat
1 4 0.0 -32.0 75.0 1 0 0 0 1 0 0 0 1 15068.dat
1 4 0.0 -32.0 105.0 1 0 0 0 1 0 0 0 1 15068.dat
1 4 0.0 -40.0 25.0 1 0 0 0 1 0 0 0 1 15068.dat

0 STEP
0 // STEP 9: Dorsal Shark Fin
1 0 0.0 -48.0 70.0 0 0 1 0 1 0 -1 0 0 2431.dat
1 0 0.0 -48.0 110.0 0 0 1 0 1 0 -1 0 0 2431.dat
1 0 0.0 -50.0 145.0 0 0 1 0 1 0 -1 0 0 2431.dat

0 STEP
0 // STEP 10: Rear Wing & Smooth Tile Endplates
1 0 -60.0 -46.0 195.0 0 1 0 -1 0 0 0 0 1 87079.dat
1 0 60.0 -46.0 195.0 0 -1 0 1 0 0 0 0 1 87079.dat
1 4 0.0 -48.0 195.0 0 0 1 0 1 0 -1 0 0 2431.dat
1 0 0.0 -54.0 200.0 0 0 1 0 1 0 -1 0 0 2431.dat
1 0 -14.0 -36.0 175.0 1 0 0 0 1 0 0 0 1 3023.dat
1 0 14.0 -36.0 175.0 1 0 0 0 1 0 0 0 1 3023.dat
1 4 0.0 -16.0 205.0 1 0 0 0 1 0 0 0 1 3024.dat

0 STEP
0 // STEP 11: Wheels, Slick Tires & Aero Dishes (Wheelbase 280 LDU)
1 0 -60.0 -38.0 -140.0 1 0 0 0 1 0 0 0 1 3389.dat
1 0 60.0 -38.0 -140.0 1 0 0 0 1 0 0 0 1 3388.dat
1 256 60.0 -14.0 -140.0 0 0 1 0 1 0 -1 0 0 80249.dat
1 72 61.0 -14.0 -140.0 0 0 1 0 1 0 -1 0 0 107728.dat
1 4 72.5 -14.0 -140.0 0 0 1 0 1 0 -1 0 0 112498.dat
1 256 -60.0 -14.0 -140.0 0 0 -1 0 1 0 1 0 0 80249.dat
1 72 -61.0 -14.0 -140.0 0 0 -1 0 1 0 1 0 0 107728.dat
1 4 -72.5 -14.0 -140.0 0 0 -1 0 1 0 1 0 0 112498.dat
1 256 60.0 -14.0 140.0 0 0 1 0 1 0 -1 0 0 80249.dat
1 72 61.0 -14.0 140.0 0 0 1 0 1 0 -1 0 0 112423.dat
1 4 72.5 -14.0 140.0 0 0 1 0 1 0 -1 0 0 112498.dat
1 256 -60.0 -14.0 140.0 0 0 -1 0 1 0 1 0 0 80249.dat
1 72 -61.0 -14.0 140.0 0 0 -1 0 1 0 1 0 0 112423.dat
1 4 -72.5 -14.0 140.0 0 0 -1 0 1 0 1 0 0 112498.dat
`;
