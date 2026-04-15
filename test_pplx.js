require('dotenv').config({ path: '.env.local' });

async function testPerplexity() {
  const url = "https://api.perplexity.ai/chat/completions";
  const body = {
    model: "sonar-pro",
    messages: [
      { role: "system", content: "You are a helpful librarian." },
      { role: "user", content: "Hello?" }
    ],
    max_tokens: 1024,
    stream: false
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.log("Status:", res.status, res.statusText);
      const text = await res.text();
      console.log("Error details:", text);
    } else {
      const data = await res.json();
      console.log("Success! Data:", JSON.stringify(data, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error("Fetch error:", err);
    process.exit(1);
  }
}

testPerplexity();
