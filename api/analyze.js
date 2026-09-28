const SYSTEM_PROMPT = `
You are ProfileGrow AI, an Instagram growth consultant for local businesses.

Analyze only the information and screenshots supplied by the user.
Never pretend to know private Instagram analytics.
Give practical and specific advice in clear English.
Avoid guaranteed growth claims.
Return valid JSON only.
`;

const DEMO_AUDIT = {
  businessName: "Sunrise Bakery",
  score: 68,
  summary:
    "Your profile looks appealing, but visitors do not get a clear reason to visit or order. Stronger local positioning and a simpler buying path can improve conversion.",
  metrics: [
    { name: "Profile & bio", score: 55 },
    { name: "Content quality", score: 81 },
    { name: "Local discovery", score: 49 },
    { name: "Conversion", score: 62 }
  ],
  problems: [
    {
      severity: "High",
      title: "The bio lacks a clear local promise",
      evidence:
        "The product, location and reason to choose the business are not immediately clear.",
      solution:
        "Lead with the signature product, location and one direct action.",
      example: "Fresh pastries baked daily in East Austin"
    },
    {
      severity: "High",
      title: "There is no direct order path",
      evidence:
        "Visitors need a faster way to see the menu or place an order.",
      solution:
        "Link directly to pre-orders, WhatsApp or the current menu.",
      example: "Pre-order tomorrow's pastry box below"
    },
    {
      severity: "Medium",
      title: "Content needs stronger local signals",
      evidence:
        "The content does not consistently mention the neighborhood or city.",
      solution:
        "Use the location in Reel hooks, captions and on-screen text.",
      example: "The croissant East Austin wakes up early for"
    }
  ],
  bio:
    "East Austin bakery\nSmall-batch pastries baked fresh daily\nPre-order tomorrow's box below",
  pillars: [
    {
      name: "Product desire",
      description: "Best sellers, close-up products and seasonal launches"
    },
    {
      name: "Behind the scenes",
      description: "Process, ingredients and daily preparation"
    },
    {
      name: "Local community",
      description: "Neighborhood stories, events and collaborations"
    },
    {
      name: "Customer proof",
      description: "Reviews, reactions and customer favourites"
    }
  ],
  actions: [
    {
      week: "Week 1",
      title: "Fix the conversion foundation",
      tasks: [
        "Rewrite the Instagram bio",
        "Create Menu, Order and Reviews highlights",
        "Add a direct order link"
      ]
    },
    {
      week: "Week 2",
      title: "Create a repeatable content system",
      tasks: [
        "Choose four content pillars",
        "Film three short product videos",
        "Write local hooks for each Reel"
      ]
    },
    {
      week: "Week 3",
      title: "Increase local discovery",
      tasks: [
        "Collaborate with one nearby business",
        "Publish a neighborhood-focused post",
        "Ask customers to tag the business"
      ]
    },
    {
      week: "Week 4",
      title: "Review and improve",
      tasks: [
        "Compare saves, shares and profile actions",
        "Repeat the strongest content format",
        "Create next month's content plan"
      ]
    }
  ]
};

function createAuditPrompt(data) {
  return `
Create a detailed Instagram business audit.

Profile URL: ${data.instagramUrl}
Business type: ${data.businessType || "Not provided"}
Location: ${data.location || "Not provided"}
Main goal: ${data.goal || "Get more local customers"}

Return JSON using exactly this structure:

{
  "businessName": "string",
  "score": 0,
  "summary": "string",
  "metrics": [
    {
      "name": "Profile & bio",
      "score": 0
    },
    {
      "name": "Content quality",
      "score": 0
    },
    {
      "name": "Local discovery",
      "score": 0
    },
    {
      "name": "Conversion",
      "score": 0
    }
  ],
  "problems": [
    {
      "severity": "High",
      "title": "string",
      "evidence": "string",
      "solution": "string",
      "example": "string"
    }
  ],
  "bio": "three-line improved Instagram bio",
  "pillars": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "actions": [
    {
      "week": "Week 1",
      "title": "string",
      "tasks": ["string"]
    }
  ]
}

Requirements:

- Score must be between 0 and 100.
- Include exactly four metrics.
- Include three to five important problems.
- Include exactly four content pillars.
- Include a four-week action plan.
- Base the analysis on the supplied screenshots.
- If information is uncertain, clearly describe it as a recommendation.
- Do not use markdown around the JSON.
`;
}

function convertImage(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(
    dataUrl || ""
  );

  if (!match) {
    return null;
  }

  return {
    inline_data: {
      mime_type: match[1],
      data: match[2]
    }
  };
}

async function callGemini(parts, systemPrompt, returnJson) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI is not configured. Add GEMINI_API_KEY in Vercel."
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const url =
    "https:" +
    "//generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: systemPrompt
        }
      ]
    },
    contents: [
      {
        role: "user",
        parts
      }
    ],
    generationConfig: {
      temperature: returnJson ? 0.35 : 0.5,
      maxOutputTokens: returnJson ? 3000 : 800,
      ...(returnJson
        ? {
            responseMimeType: "application/json"
          }
        : {})
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
        `Gemini request failed with status ${response.status}`
    );
  }

  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    if (body.action === "demo") {
      return res.status(200).json(DEMO_AUDIT);
    }

    if (body.action === "chat") {
      const question = String(body.question || "").slice(0, 1500);
      const audit = JSON.stringify(body.audit || {}).slice(0, 14000);

      const answer = await callGemini(
        [
          {
            text: `Audit information:\n${audit}\n\nUser question:\n${question}`
          }
        ],
        `You are ProfileGrow Coach.

Give concise and specific Instagram growth advice based on the supplied audit.
Never invent private analytics.
Answer in clear English.`,
        false
      );

      return res.status(200).json({
        answer
      });
    }

    if (!body.instagramUrl) {
      return res.status(400).json({
        error: "Instagram profile link is required."
      });
    }

    const parts = [
      {
        text: createAuditPrompt(body)
      }
    ];

    for (const image of (body.images || []).slice(0, 6)) {
      const imagePart = convertImage(image);

      if (imagePart) {
        parts.push(imagePart);
      }
    }

    const responseText = await callGemini(
      parts,
      SYSTEM_PROMPT,
      true
    );

    const audit = parseJsonResponse(responseText);

    return res.status(200).json(audit);
  } } catch (error) {
  console.error("ProfileGrow API error:", error);

  return res.status(500).json({
    error: error.message || "Unable to analyze the profile."
  });
}
};
