
# Plan: Migrare translate-text și translate-product la Lovable AI

## Rezumat

Vom migra cele 2 funcții de traducere de la Gemini API la **Lovable AI Gateway**, eliminând dependența de `GEMINI_API_KEY`.

> **Notă**: Funcția `generate-specifications` este deja migrată la Lovable AI.

---

## Funcții de migrat

| Funcție | Status actual | După migrare |
|---------|---------------|--------------|
| `translate-text` | Gemini API (`GEMINI_API_KEY`) | Lovable AI (`LOVABLE_API_KEY`) |
| `translate-product` | Gemini API (`GEMINI_API_KEY`) | Lovable AI (`LOVABLE_API_KEY`) |
| `generate-specifications` | ✅ Deja Lovable AI | - |
| `chat-assistant` | ✅ Deja Lovable AI | - |

---

## Modificări pentru fiecare funcție

### 1. `supabase/functions/translate-text/index.ts`

**Schimbări:**
- Înlocuire `GEMINI_API_KEY` → `LOVABLE_API_KEY`
- Schimbare endpoint: `generativelanguage.googleapis.com` → `ai.gateway.lovable.dev`
- Schimbare model: `gemini-2.0-flash` → `google/gemini-2.5-flash`
- Adaptare format mesaje (de la Gemini la OpenAI format)
- Adăugare error handling pentru 402 (Payment Required)
- Actualizare extragere răspuns: `candidates[0].content.parts[0].text` → `choices[0].message.content`

### 2. `supabase/functions/translate-product/index.ts`

**Schimbări identice cu translate-text:**
- Înlocuire `GEMINI_API_KEY` → `LOVABLE_API_KEY`
- Schimbare endpoint și model
- Adaptare format mesaje
- Adăugare error handling 402
- Actualizare extragere răspuns

---

## Structura nouă a request-ului

```typescript
// Înainte (Gemini API)
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
    })
  }
);

// După (Lovable AI)
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "You are a professional translator..." },
      { role: "user", content: prompt }
    ],
  }),
});
```

---

## Beneficii

- **Eliminare GEMINI_API_KEY** - Nu mai ai nevoie de API key extern
- **Consistență** - Toate funcțiile AI folosesc același gateway
- **Mentenanță simplificată** - Un singur punct de configurare
- **Cost inclus** - Utilizare în limita Lovable

---

## Pași de implementare

1. Actualizare `translate-text/index.ts`
2. Actualizare `translate-product/index.ts`
3. Deploy automat al funcțiilor
4. Testare traduceri în admin panel
