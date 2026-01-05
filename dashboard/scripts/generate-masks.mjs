#!/usr/bin/env node
/**
 * Generate foreground masks for photos using RMBG-1.4 model
 * This creates the depth effect by separating subjects from backgrounds
 */

import { AutoProcessor, AutoModel, RawImage } from '@huggingface/transformers';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PHOTOS_DIR = './public/photos';

async function generateMasks() {
  console.log('Loading RMBG-1.4 segmentation model...');
  console.log('(First run will download ~180MB model, subsequent runs use cache)\n');

  // Load model and processor
  const model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
    // Use FP16 on supported devices for faster processing
  });
  const processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');

  console.log('Model loaded successfully!\n');

  // Find all photos
  const files = fs.readdirSync(PHOTOS_DIR);
  const photos = files.filter(f =>
    /^photo\d+\.(jpg|jpeg|png|webp)$/i.test(f)
  );

  console.log(`Found ${photos.length} photos to process\n`);

  for (const photo of photos) {
    const baseName = photo.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const photoPath = path.join(PHOTOS_DIR, photo);
    const maskPath = path.join(PHOTOS_DIR, `${baseName}_mask.png`);
    const fgPath = path.join(PHOTOS_DIR, `${baseName}_fg.png`);

    // Skip if foreground already exists
    if (fs.existsSync(fgPath)) {
      console.log(`✓ ${photo} - foreground already exists, skipping`);
      continue;
    }

    console.log(`Processing ${photo}...`);
    const startTime = Date.now();

    try {
      // Read original image metadata
      const originalBuffer = fs.readFileSync(photoPath);
      const originalMeta = await sharp(originalBuffer).metadata();

      // Load image with RawImage
      const image = await RawImage.fromBlob(new Blob([originalBuffer]));

      // Process the image
      const { pixel_values } = await processor(image);

      // Run model
      const { output } = await model({ input: pixel_values });

      // Get mask data
      const maskData = output.tolist()[0][0];

      // Convert mask to image buffer
      const height = maskData.length;
      const width = maskData[0].length;

      // Flatten and scale mask values to 0-255
      const maskPixels = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          maskPixels[y * width + x] = Math.round(maskData[y][x] * 255);
        }
      }

      // Resize mask to original image dimensions
      const resizedMask = await sharp(Buffer.from(maskPixels), {
        raw: {
          width: width,
          height: height,
          channels: 1,
        }
      })
        .resize(originalMeta.width, originalMeta.height)
        .png()
        .toBuffer();

      // Save the mask
      fs.writeFileSync(maskPath, resizedMask);

      // Create foreground image (original with transparent background)
      const rgba = await sharp(originalBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const maskGray = await sharp(resizedMask)
        .raw()
        .toBuffer();

      // Apply mask to alpha channel
      const pixels = new Uint8Array(rgba.data);
      for (let i = 0; i < maskGray.length; i++) {
        pixels[i * 4 + 3] = maskGray[i];
      }

      const fgBuffer = await sharp(Buffer.from(pixels), {
        raw: {
          width: rgba.info.width,
          height: rgba.info.height,
          channels: 4,
        }
      })
        .png()
        .toBuffer();

      fs.writeFileSync(fgPath, fgBuffer);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Generated mask and foreground (${elapsed}s)`);
    } catch (error) {
      console.error(`  ✗ Error processing ${photo}:`, error.message);
    }
  }

  console.log('\nDone!');
}

// Run
generateMasks().catch(console.error);
