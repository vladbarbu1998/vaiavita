
# Plan: Migrare Chatbot de la Gemini API la Lovable AI

## Rezumat

Vom migra chatbot-ul VAIAVITA de la utilizarea directă a Gemini API (care necesită `GEMINI_API_KEY`) la **Lovable AI Gateway**, care este **inclus automat** în proiectele Lovable Cloud și nu necesită nicio configurare suplimentară.

---

## Ce se schimbă

| Aspect | Acum (Gemini API) | După (Lovable AI) |
|--------|-------------------|-------------------|
| **API Key** | `GEMINI_API_KEY` (manual) | `LOVABLE_API_KEY` (automat) |
| **Endpoint** | `generativelanguage.googleapis.com` | `ai.gateway.lovable.dev` |
| **Model** | `gemini-2.0-flash` | `google/gemini-3-flash-preview` |
| **Cost** | Plătit separat la Google | Inclus în Lovable (cu limite) |

---

## Beneficii

- **Nu mai ai nevoie de API key** - `LOVABLE_API_KEY` este deja configurat automat
- **Aceleași capabilități** - Gemini 3 Flash Preview oferă performanțe similare sau mai bune
- **Cost inclus** - Utilizare gratuită limitată inclusă în Lovable
- **Simplitate** - Fără configurări externe

---

## Modificări tehnice

### 1. Actualizare `supabase/functions/chat-assistant/index.ts`

```text
Schimbări:
├── Înlocuire GEMINI_API_KEY cu LOVABLE_API_KEY
├── Schimbare endpoint de la Google la Lovable AI Gateway
├── Actualizare format mesaje (de la Gemini format la OpenAI format)
├── Adăugare handling pentru erori 429 (rate limit) și 402 (payment required)
└── Păstrare SITE_CONTEXT și logică existentă
```

### 2. Structura nouă a request-ului

```typescript
// Endpoint nou
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: SITE_CONTEXT },
      ...conversationHistory,
      { role: "user", content: message }
    ],
    temperature: 0.7,
    max_tokens: 500,
  }),
});
```

### 3. Handling erori actualizat

- **429 (Rate Limit)**: "Sistemul este momentan ocupat..."
- **402 (Payment Required)**: "Limită de utilizare atinsă..."

---

## Pași de implementare

1. **Modificare `chat-assistant/index.ts`**
   - Schimbare de la Gemini API la Lovable AI Gateway
   - Adaptare format mesaje
   - Actualizare error handling

2. **Deploy edge function**
   - Funcția va fi deployată automat

3. **Testare chatbot**
   - Verificare funcționare pe site

---

## Notă importantă

Celelalte funcții care folosesc Gemini API (`translate-text`, `translate-product`, `generate-specifications`) pot fi și ele migrate ulterior dacă dorești, dar pentru moment doar chatbot-ul va fi migrat.
