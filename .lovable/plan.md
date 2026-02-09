
# Plan: Actualizare informații chatbot (prețuri și produse)

## Problemele identificate

1. **Preț greșit Dent-Tastic**: Chatbot-ul spune 29.99 lei, dar pe site prețul real este **32.99 lei**
2. **Periuța de dinți**: Chatbot-ul spune că nu este de vânzare separat, dar pe site este listată la **7.99 lei** și disponibilă pentru cumpărare

## Modificări

### Fișier: `supabase/functions/chat-assistant/index.ts`

Actualizare secțiunea **AVAILABLE PRODUCTS** din `SITE_CONTEXT`:

**Produs 1 - Dent-Tastic Fresh Mint:**
- Preț corectat: `29.99 lei` -> `32.99 lei` (~6.50 EUR)

**Produs 2 - Periuța VAIAVITA:**
- Adăugare: disponibilă și separat la **7.99 lei**
- Păstrare info: GRATUITĂ la 2+ paste Dent-Tastic
- Periuța poate fi cumpărată individual din magazin

**Actualizare secțiunea PROMOȚII:**
- Clarificare că prețul pentru 2 paste = 65.98 lei (nu 59.98)

## Ce rămâne neschimbat

- Toate celelalte informații (companie, livrare, plată, retururi, DentalMed, creator website, reguli limbă, stil comunicare)
- Logica de funcționare a chatbot-ului
- Endpoint-ul și modelul AI

## Detalii tehnice

Se modifică doar string-ul `SITE_CONTEXT` din `supabase/functions/chat-assistant/index.ts`, actualizând:
- Linia 37: preț Dent-Tastic de la 29.99 la 32.99
- Liniile 46-48: periuța - adăugare preț 7.99 lei și disponibilitate separată
- Deploy automat al funcției
