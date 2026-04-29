/*
 * © 2026 SeXyxeon (VOIDSEC)
 *
 * ⚠️ COPYRIGHT NOTICE
 * This source code is protected under copyright law.
 * Any form of re-uploading, recoding, modification,
 * selling, or redistribution WITHOUT explicit permission
 * from the original author is strictly prohibited.
 *
 * ❌ NO CREDIT = NO PERMISSION
 * ❌ DO NOT CLAIM THIS CODE AS YOUR OWN
 *
 * ✔️ Usage or modification is allowed ONLY
 * with prior permission and proper credit.
 *
 * OFFICIAL LINKS (ONLY):
 * YouTube   : https://youtube.com/@voidsec7718
 * Instagram : sabir._7718
 * Telegram  : https://t.me/SABIR7718
 * GitHub    : https://github.com/SABIR7718
 * WhatsApp  : +91 73650 85213
 *
 * Violations may result in DMCA takedown
 * or termination of the Telegram bot.
 */

const express = require('express');
const multer = require('multer');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { log } = require('@sabir7718/log');

ffmpeg.setFfmpegPath(ffmpegPath);

const SABIR7718 = express();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});

const TEMP_DIR = './temp';
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const generateID = () => crypto.randomBytes(6).toString('hex');

const isVideo = (mimetype) => {
    return mimetype.startsWith('video') || mimetype === 'image/gif';
};

const convertToWebp = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-vcodec libwebp',
                '-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15',
                '-loop 0',
                '-ss 00:00:00',
                '-t 00:00:08',
                '-preset default',
                '-an',
                '-vsync 0'
            ])
            .toFormat('webp')
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
};

SABIR7718.post('/sticker', upload.single('file'), async (req, res) => {
    let tempInput, tempOutput;

    try {
        if (!req.file) {
            return res.status(400).json({ status: false, message: 'No file uploaded' });
        }

        const {
            pack = 'Zoro MD',
            author = 'VOIDSEC',
            type = 'full',
            quality = 70,
            background = 'transparent'
        } = req.body;

        const stickerType = {
            full: StickerTypes.FULL,
            crop: StickerTypes.CROPPED,
            circle: StickerTypes.CIRCLE
        }[type] || StickerTypes.FULL;

        const id = generateID();

        if (isVideo(req.file.mimetype)) {

            tempInput = path.join(TEMP_DIR, `${id}_input`);
            tempOutput = path.join(TEMP_DIR, `${id}_output.webp`);

            fs.writeFileSync(tempInput, req.file.buffer);

            await convertToWebp(tempInput, tempOutput);

            const webpBuffer = fs.readFileSync(tempOutput);

            res.set({
                'Content-Type': 'image/webp'
            });

            res.send(webpBuffer);

        } else {
            const sticker = new Sticker(req.file.buffer, {
                pack,
                author,
                type: stickerType,
                id,
                quality: parseInt(quality),
                background
            });

            const stickerBuffer = await sticker.toBuffer();

            res.set({
                'Content-Type': 'image/webp'
            });

            res.send(stickerBuffer);
        }

        log('success', 'STICKER', `Created (${req.file.mimetype})`);

    } catch (err) {
        log('error', 'STICKER', err.message);

        res.status(500).json({
            status: false,
            message: 'Conversion failed',
            error: err.message
        });

    } finally {
        if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
});

SABIR7718.listen(3000, () => {
    log('success', 'SERVER', 'Advanced Sticker API Running on 3000');
});