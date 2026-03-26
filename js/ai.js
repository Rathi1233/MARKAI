export async function getAIResponse(prompt, base64Image = null, isJson = false) {
  let messages = [];

  if (base64Image) {
    messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ];
  } else {
    messages = [
      { role: "user", content: prompt }
    ];
  }

  const payload = {
    model: "openai/gpt-4o-mini",
    messages: messages
  };

  if (isJson) {
    payload.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!data || !data.choices || data.choices.length === 0) {
    throw new Error("Failed to get AI response.");
  }
  return data.choices[0].message.content;
}