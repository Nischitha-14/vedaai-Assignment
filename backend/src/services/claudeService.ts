export const requestQuestionPaperFromClaude = async ({
  apiKey,
  model,
  prompt
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) => {
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("Claude API key is not configured.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data.content
    ?.filter((item) => item.type === "text" && item.text)
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Claude response did not include a text payload.");
  }

  return text;
};
