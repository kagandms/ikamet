export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API Key is not configured on the server.' });
    }

    try {
        const { imageContent } = req.body;

        if (!imageContent) {
            return res.status(400).json({ error: 'No image content provided.' });
        }

        const requestBody = {
            requests: [
                {
                    image: {
                        content: imageContent
                    },
                    features: [
                        { type: 'DOCUMENT_TEXT_DETECTION' }
                    ],
                    imageContext: {
                        languageHints: ["tr", "en"] // Dil algılamayı atlar, hızı ve TR karakter doğruluğunu artırır
                    }
                }
            ]
        };

        // Ping süresini düşürmek için Avrupa sunucusuna yönlendir (Türkiye için daha hızlı)
        const googleVisionUrl = `https://eu-vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

        const response = await fetch(googleVisionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('OCR Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
