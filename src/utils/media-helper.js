const {
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

function inspectBuffer(buf, label) {
    if (!buf || !Buffer.isBuffer(buf)) {
        console.log(
            `[media-helper] ${label}: Invalid buffer`
        );

        return;
    }

    if (buf.length < 12) {
        console.log(
            `[media-helper] ${label}: Buffer too small (${buf.length} bytes)`
        );

        return;
    }

    const hex = buf
        .subarray(0, 12)
        .toString('hex')
        .toUpperCase();

    console.log(
        `[media-helper] ${label}: First 12 bytes: ${hex}`
    );
}

/**
 * Unwrap common WhatsApp message wrappers.
 */
function unwrapMessage(message) {
    if (!message) {
        return null;
    }

    let current = message;

    // ephemeralMessage
    if (current.ephemeralMessage?.message) {
        current = current.ephemeralMessage.message;
    }

    // viewOnceMessage
    if (current.viewOnceMessage?.message) {
        current = current.viewOnceMessage.message;
    }

    // viewOnceMessageV2
    if (current.viewOnceMessageV2?.message) {
        current = current.viewOnceMessageV2.message;
    }

    // viewOnceMessageV2Extension
    if (current.viewOnceMessageV2Extension?.message) {
        current = current.viewOnceMessageV2Extension.message;
    }

    return current;
}

/**
 * Get media from a WhatsApp message.
 */
function getMediaMessage(message) {
    const content = unwrapMessage(message);

    if (!content) {
        return null;
    }

    if (content.imageMessage) {
        return {
            type: 'image',
            message: content.imageMessage
        };
    }

    if (content.videoMessage) {
        return {
            type: 'video',
            message: content.videoMessage
        };
    }

    if (content.documentMessage) {
        return {
            type: 'document',
            message: content.documentMessage
        };
    }

    if (content.stickerMessage) {
        return {
            type: 'sticker',
            message: content.stickerMessage
        };
    }

    return null;
}

/**
 * Download encrypted WhatsApp media.
 *
 * IMPORTANT:
 * Do not axios.get(media.url).
 * WhatsApp media URLs are not normal public image URLs.
 */
async function downloadWhatsAppMedia(mediaMessage, mediaType) {
    const stream = await downloadContentFromMessage(
        mediaMessage,
        mediaType
    );

    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
}

async function extractMediaBuffer(client, message) {
    if (!message) {
        return null;
    }

    /*
     * ---------------------------------------------------------
     * 1. Cari quoted message
     * ---------------------------------------------------------
     */

    const quotedRaw =
        message?.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage;

    /*
     * ---------------------------------------------------------
     * 2. Tentukan sumber media
     * ---------------------------------------------------------
     */

    let mediaSource = quotedRaw;

    if (!mediaSource) {
        mediaSource = message?.message;
    }

    mediaSource = unwrapMessage(mediaSource);

    if (!mediaSource) {
        return null;
    }

    /*
     * ---------------------------------------------------------
     * 3. Ambil media
     * ---------------------------------------------------------
     */

    const mediaInfo = getMediaMessage(mediaSource);

    if (!mediaInfo) {
        return null;
    }

    const {
        type: mediaType,
        message: media
    } = mediaInfo;

    console.log(
        '[media-helper] Extracting media type:',
        mediaType,
        'mimetype:',
        media.mimetype || 'unknown'
    );

    /*
     * ---------------------------------------------------------
     * 4. Download media melalui Baileys
     * ---------------------------------------------------------
     *
     * Jangan menggunakan:
     *
     * axios.get(media.url)
     *
     * karena media.url adalah URL media WhatsApp terenkripsi.
     */

    try {
        const buffer = await downloadWhatsAppMedia(
            media,
            mediaType
        );

        if (!buffer || buffer.length === 0) {
            console.warn(
                '[media-helper] Downloaded media is empty'
            );

            return null;
        }

        console.log(
            '[media-helper] Downloaded media buffer size:',
            buffer.length,
            'type:',
            mediaType
        );

        inspectBuffer(
            buffer,
            'Downloaded buffer'
        );

        return buffer;

    } catch (error) {
        console.error(
            '[media-helper] Media download error:',
            error?.message || error
        );

        return null;
    }
}

module.exports = {
    extractMediaBuffer
};