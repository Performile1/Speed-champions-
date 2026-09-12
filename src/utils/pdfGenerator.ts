import jsPDF from 'jspdf';
import { LegoF1Set, CarPartColors, CarDecals, ManualStep, GranularLegoPart } from '../types';

/**
 * Compiles and downloads a multi-page authentic LEGO instruction booklet PDF
 */
export function generateInstructionManualPdf(
  set: LegoF1Set,
  colors: CarPartColors,
  decals: CarDecals,
  steps: ManualStep[],
  parts: GranularLegoPart[],
  snapshotUrl?: string
) {
  // A4 Landscape format: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // ----------------------------------------------------
  // COVER PAGE (Page 1)
  // ----------------------------------------------------
  // Top Yellow/Black LEGO racing header band
  doc.setFillColor(245, 158, 11); // Amber/Yellow
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setFillColor(220, 38, 38); // Red LEGO square
  doc.rect(14, 3, 14, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('LEGO', 16, 11);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('SPEED CHAMPIONS  |  OFFICIAL BUILDING INSTRUCTIONS', 34, 11);

  // Background subtle grid
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  for (let x = 10; x < pageWidth; x += 20) {
    doc.line(x, 22, x, pageHeight - 15);
  }

  // Cover Main Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`Set #${set.articleNumber}`, 20, 42);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(set.name, 20, 52);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${set.team} • ${set.year} Season Challenger • ${set.pieceCount} Pieces`, 20, 60);

  // Big Spec Badges
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, 70, 48, 22, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(set.era === 'classic-6-wide' ? '8+' : '10+', 26, 82);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('RECOMMENDED AGE', 26, 88);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(74, 70, 56, 22, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${set.pieceCount} pcs`, 80, 82);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EXACT PIECE COUNT', 80, 88);

  // Minifig & Livery spec
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(136, 70, 72, 22, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Driver #${decals.racingNumber}`, 142, 81);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Sponsor: ${decals.sponsorPrimary}`, 142, 88);

  // If we have a snapshot render, embed it on the right
  if (snapshotUrl) {
    try {
      doc.addImage(snapshotUrl, 'PNG', 120, 96, 160, 95);
    } catch {
      // ignore image render failure
    }
  }

  // Cover Feature Highlights box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.8);
  doc.roundedRect(20, 102, 94, 82, 4, 4, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BUILDER SPECIFICATIONS', 26, 112);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const specs = [
    `• Scale: Authentic Speed Champions 8-stud wide chassis`,
    `• Aerodynamics: Stepped nose, ground-effect undercut sidepods`,
    `• Safety: FIA titanium Halo safety ring cockpit enclosure`,
    `• Powertrain: V6 Turbo-Hybrid engine cover & shark fin`,
    `• Wheels: 18-inch aerodynamic rim covers & Pirelli slick tires`,
    `• BrickLink XML Wanted List ready for direct sourcing`,
  ];
  specs.forEach((line, i) => {
    doc.text(line, 26, 122 + i * 10);
  });

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('LEGO® SPEED CHAMPIONS F1 CUSTOMIZER  •  BOOKLET 1 OF 1', 20, pageHeight - 5);
  doc.text('COVER PAGE', pageWidth - 40, pageHeight - 5);

  // ----------------------------------------------------
  // EACH STEP PAGE (Pages 2 to N)
  // ----------------------------------------------------
  steps.forEach((step, index) => {
    doc.addPage('a4', 'landscape');

    // Step Header Bar
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 12, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`LEGO® SET #${set.articleNumber}  •  STEP ${step.stepNumber} OF ${steps.length}`, 16, 8);
    doc.text(`SUB-ASSEMBLY: ${step.subAssembly.toUpperCase()}`, pageWidth - 90, 8);

    // Big Step Number Badge
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(16, 18, 18, 18, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${step.stepNumber}`, step.stepNumber > 9 ? 18 : 22, 31);

    // Step Title & Description
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, 40, 26);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(step.description, 180), 40, 33);

    // LEFT COLUMN: Parts Callout Box with exact Article Numbers / Element IDs
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(16, 44, 96, 118, 4, 4, 'FD');

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(16, 44, 96, 12, 4, 4, 'F');
    doc.rect(16, 52, 96, 4, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`REQUIRED BRICKS (STEP ${step.stepNumber})`, 22, 52);

    step.partsRequired.forEach((part, pIdx) => {
      const y = 64 + pIdx * 24;
      if (y < 155) {
        // Part box container
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, y - 6, 88, 20, 2, 2, 'FD');

        // Quantity pill
        doc.setFillColor(245, 158, 11);
        doc.roundedRect(23, y - 3, 12, 14, 2, 2, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${part.quantity}x`, 24, y + 6);

        // Piece Name & Element Number
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(part.piece, 68)[0], 38, y);

        // Element ID & Dimensions & Color
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Design #${part.designId} • Item #${part.elementId} • ${part.colorName}`,
          38,
          y + 6
        );
      }
    });

    // RIGHT COLUMN: Directional Assembly Diagram with directional arrow indicators
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(118, 44, 162, 118, 4, 4, 'FD');

    // Direction Banner Inside Visual Stage
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(124, 50, 150, 18, 3, 3, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`ASSEMBLY DIRECTION:  ${step.directionLabel.toUpperCase()}`, 130, 58);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text(step.studAlignment, 130, 64);

    // Directional Arrow Visuals
    doc.setDrawColor(245, 158, 11);
    doc.setFillColor(245, 158, 11);
    doc.setLineWidth(2.5);

    // Draw stylized large LEGO instructional arrow based on direction
    const arrowCenterX = 195;
    const arrowCenterY = 105;

    if (step.arrowDirection.type === 'down') {
      // Downward pressing arrow (studs connection)
      doc.line(arrowCenterX, arrowCenterY - 20, arrowCenterX, arrowCenterY + 10);
      doc.triangle(
        arrowCenterX - 8,
        arrowCenterY + 10,
        arrowCenterX + 8,
        arrowCenterY + 10,
        arrowCenterX,
        arrowCenterY + 22,
        'FD'
      );
    } else if (step.arrowDirection.type === 'front-slide') {
      // Forward sliding arrow
      doc.line(arrowCenterX - 24, arrowCenterY, arrowCenterX + 10, arrowCenterY);
      doc.triangle(
        arrowCenterX + 10,
        arrowCenterY - 8,
        arrowCenterX + 10,
        arrowCenterY + 8,
        arrowCenterX + 22,
        arrowCenterY,
        'FD'
      );
    } else if (step.arrowDirection.type === 'horizontal-in') {
      // Inward lateral snap
      doc.line(arrowCenterX - 18, arrowCenterY - 10, arrowCenterX + 8, arrowCenterY);
      doc.triangle(
        arrowCenterX + 8,
        arrowCenterY - 8,
        arrowCenterX + 8,
        arrowCenterY + 8,
        arrowCenterX + 18,
        arrowCenterY,
        'FD'
      );
    } else if (step.arrowDirection.type === 'wheel-mount') {
      // Axle pin push
      doc.line(arrowCenterX - 20, arrowCenterY, arrowCenterX + 12, arrowCenterY);
      doc.triangle(
        arrowCenterX + 12,
        arrowCenterY - 8,
        arrowCenterX + 12,
        arrowCenterY + 8,
        arrowCenterX + 24,
        arrowCenterY,
        'FD'
      );
      // Axle ring
      doc.circle(arrowCenterX - 20, arrowCenterY, 6, 'S');
    } else {
      // Rotary tilt
      doc.line(arrowCenterX - 15, arrowCenterY - 15, arrowCenterX, arrowCenterY + 10);
      doc.triangle(
        arrowCenterX - 6,
        arrowCenterY + 10,
        arrowCenterX + 8,
        arrowCenterY + 6,
        arrowCenterX + 2,
        arrowCenterY + 20,
        'FD'
      );
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(step.arrowDirection.label, arrowCenterX, arrowCenterY + 36, { align: 'center' });

    // Master Builder Tip at bottom
    if (step.tip) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(16, 168, 264, 18, 3, 3, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('MASTER BUILDER TIP:', 22, 175);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(doc.splitTextToSize(step.tip, 210), 65, 175);
    }

    // Step Footer
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`LEGO® SPEED CHAMPIONS F1 #${set.articleNumber}`, 20, pageHeight - 4);
    doc.text(`PAGE ${index + 2} OF ${steps.length + 2}`, pageWidth - 45, pageHeight - 4);
  });

  // ----------------------------------------------------
  // FINAL PAGE: FULL BILL OF MATERIALS & BRICKLINK INVENTORY
  // ----------------------------------------------------
  doc.addPage('a4', 'landscape');

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, pageWidth, 14, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`LEGO® SET #${set.articleNumber}  •  COMPLETE BILL OF MATERIALS (BOM)`, 16, 9);
  doc.text('BRICKLINK SOURCING INVENTORY', pageWidth - 80, 9);

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(16, 20, pageWidth - 32, 8, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DESIGN ID', 20, 25);
  doc.text('ELEMENT NO', 48, 25);
  doc.text('PART NAME / DESCRIPTION', 82, 25);
  doc.text('SUB-ASSEMBLY ROLE', 170, 25);
  doc.text('COLOR NAME', 228, 25);
  doc.text('QTY', 270, 25);

  parts.forEach((p, idx) => {
    const y = 33 + idx * 7.2;
    if (y < pageHeight - 16) {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(16, y - 4.5, pageWidth - 32, 7.2, 'F');
      }
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`#${p.designId}`, 20, y);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(p.elementId, 48, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(p.name, 82)[0], 82, y);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(p.subAssembly, 170, y);

      doc.setTextColor(30, 41, 59);
      doc.text(p.colorName, 228, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.quantity}x`, 272, y);
    }
  });

  // Footer notes for BrickLink
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(
    'Direct BrickLink Wanted List XML can be exported directly from the Speed Champions 3D Livery Studio.',
    20,
    pageHeight - 5
  );
  doc.text(`TOTAL PARTS: ${set.pieceCount}`, pageWidth - 45, pageHeight - 5);

  doc.save(`LEGO-${set.articleNumber}-Instruction-Manual.pdf`);
}

/**
 * Compiles and downloads the complete unfolded box packaging dieline in PDF
 * including all 6 faces, glue tabs, and cut/fold guide lines.
 */
export function generateUnfoldedBoxPdf(
  set: LegoF1Set,
  colors: CarPartColors,
  decals: CarDecals,
  customTitle?: string,
  customSubtitle?: string,
  snapshotUrl?: string
) {
  // A3 Landscape format: 420mm x 297mm (Standard packaging die cut sheet)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = 420;
  const pageHeight = 297;

  // Background sheet
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Sheet Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('LEGO® SPEED CHAMPIONS™ RETAIL PACKAGING DIELINE (UTVIKT FORMAT)', 20, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Set #${set.articleNumber} • Authentic 1:1 Scale Speed Champions Box Net • Solid lines = CUT, Dashed lines = FOLD/SCORE`,
    20,
    22
  );

  // Box Dimensions in mm on paper
  // Front & Back: 140mm width x 90mm height
  // Spines (Left & Right): 45mm width x 90mm height
  // Flaps (Top & Bottom): 140mm width x 45mm height
  // Tuck tabs & Glue flaps: 15mm width
  const startX = 60;
  const startY = 40;
  const faceW = 135;
  const faceH = 88;
  const depth = 42;
  const glueTabW = 14;

  // Colors & Styles for Dieline
  doc.setLineWidth(0.4);

  // Helper for drawing panel outlines
  const drawCutRect = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(220, 38, 38); // Red = Cut Line
    doc.setLineDashPattern([], 0);
    doc.rect(x, y, w, h, 'S');
  };

  const drawFoldRect = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(37, 99, 235); // Blue = Fold / Crease Line
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(x, y, w, h, 'S');
  };

  // 1. TOP FLAP (Above Front Face)
  const topX = startX + depth;
  const topY = startY;
  doc.setFillColor(15, 23, 42);
  doc.rect(topX, topY, faceW, depth, 'F');
  drawFoldRect(topX, topY, faceW, depth);

  // Top Flap Graphics: LEGO Logo & 1:1 Scale Wheel
  doc.setFillColor(220, 38, 38);
  doc.rect(topX + 8, topY + 8, 14, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LEGO', topX + 9, topY + 17);

  doc.setFontSize(10);
  doc.text('SPEED CHAMPIONS', topX + 26, topY + 18);

  // 1:1 Scale Wheel Callout on Top Flap
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.circle(topX + faceW - 24, topY + depth / 2, 12, 'S');
  doc.setFontSize(6.5);
  doc.text('1:1 ACTUAL SIZE', topX + faceW - 44, topY + depth / 2 - 2);
  doc.text('Pirelli Slick Tire', topX + faceW - 44, topY + depth / 2 + 3);

  // 2. FRONT FACE (Central Primary Panel)
  const frontX = startX + depth;
  const frontY = startY + depth;
  doc.setFillColor(15, 23, 42);
  doc.rect(frontX, frontY, faceW, faceH, 'F');
  drawFoldRect(frontX, frontY, faceW, faceH);

  // Front Face Header
  doc.setFillColor(220, 38, 38);
  doc.rect(frontX + 8, frontY + 8, 16, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('LEGO', frontX + 10, frontY + 19);

  doc.setFontSize(12);
  doc.text('SPEED CHAMPIONS', frontX + 28, frontY + 19);

  // Set Info Left
  doc.setFontSize(14);
  doc.text(`${set.era === 'classic-6-wide' ? '8+' : '10+'}`, frontX + 10, frontY + 40);
  doc.setFontSize(11);
  doc.text(`${set.articleNumber}`, frontX + 10, frontY + 48);
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(customTitle || set.name, frontX + 10, frontY + 56);
  doc.text(`${set.pieceCount} pcs/pzs`, frontX + 10, frontY + 63);

  // Embed Hero Snapshot if provided
  if (snapshotUrl) {
    try {
      doc.addImage(snapshotUrl, 'PNG', frontX + 38, frontY + 22, 92, 58);
    } catch {
      // ignore
    }
  }

  // Curb graphics
  doc.setFillColor(220, 38, 38);
  doc.rect(frontX + faceW - 12, frontY + 28, 6, 52, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(frontX + faceW - 6, frontY + 28, 6, 52, 'F');

  // 3. LEFT SPINE FLAP
  const leftX = startX;
  const leftY = startY + depth;
  doc.setFillColor(30, 41, 59);
  doc.rect(leftX, leftY, depth, faceH, 'F');
  drawFoldRect(leftX, leftY, depth, faceH);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Set #${set.articleNumber}`, leftX + 6, leftY + 16);
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(set.team, leftX + 6, leftY + 26);
  doc.text(`Minifig Driver: #${decals.racingNumber}`, leftX + 6, leftY + 36);

  // 4. RIGHT SPINE FLAP
  const rightX = frontX + faceW;
  const rightY = startY + depth;
  doc.setFillColor(30, 41, 59);
  doc.rect(rightX, rightY, depth, faceH, 'F');
  drawFoldRect(rightX, rightY, depth, faceH);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMULA 1®', rightX + 6, rightY + 16);
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICIAL LICENSED', rightX + 6, rightY + 24);
  doc.text(`ERA: ${set.era.toUpperCase()}`, rightX + 6, rightY + 32);

  // 5. REAR FACE (Back Panel)
  const backX = rightX + depth;
  const backY = startY + depth;
  doc.setFillColor(15, 23, 42);
  doc.rect(backX, backY, faceW, faceH, 'F');
  drawFoldRect(backX, backY, faceW, faceH);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTION & PLAY FEATURES', backX + 10, backY + 18);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('• Removable cockpit Halo for minifigure access', backX + 10, backY + 28);
  doc.text('• Adjustable DRS rear wing downforce flap', backX + 10, backY + 36);
  doc.text('• Modular aerodynamic wheel covers & Pirelli tires', backX + 10, backY + 44);
  doc.text('• Sculpted Venturi ground-effect undercut tunnels', backX + 10, backY + 52);

  // 6. BOTTOM FLAP (Under Front Face)
  const botX = startX + depth;
  const botY = frontY + faceH;
  doc.setFillColor(241, 245, 249);
  doc.rect(botX, botY, faceW, depth, 'F');
  drawFoldRect(botX, botY, faceW, depth);

  // Barcode representation
  doc.setFillColor(0, 0, 0);
  for (let i = 0; i < 38; i++) {
    const barW = (i % 3 === 0 ? 1.4 : 0.7);
    doc.rect(botX + 12 + i * 2.2, botY + 8, barW, 18, 'F');
  }
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.text(`5 702017 772421`, botX + 24, botY + 30);

  // Legal safety marks & CE
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('WARNING: CHOKING HAZARD - Small parts. Not for children under 3 years.', botX + 46, botY + 38);
  doc.text('CE  •  Manufactured by the LEGO Group, DK-7190 Billund, Denmark.', botX + 46, botY + 42);

  // 7. GLUE FLAP & TUCK TABS (Cut lines)
  const glueX = backX + faceW;
  const glueY = backY;
  doc.setFillColor(248, 250, 252);
  doc.rect(glueX, glueY + 6, glueTabW, faceH - 12, 'FD');
  drawCutRect(glueX, glueY + 6, glueTabW, faceH - 12);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('GLUE TAB', glueX + 2, glueY + faceH / 2);

  // Legend box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, pageHeight - 34, 180, 22, 3, 3, 'F');
  doc.setDrawColor(220, 38, 38);
  doc.setLineDashPattern([], 0);
  doc.line(26, pageHeight - 24, 46, pageHeight - 24);
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RED SOLID LINE: Cut Path', 50, pageHeight - 22);

  doc.setDrawColor(37, 99, 235);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(100, pageHeight - 24, 120, pageHeight - 24);
  doc.setTextColor(37, 99, 235);
  doc.text('BLUE DASHED LINE: Score & Fold Crease', 124, pageHeight - 22);

  doc.save(`LEGO-${set.articleNumber}-Unfolded-Box-Dieline.pdf`);
}
