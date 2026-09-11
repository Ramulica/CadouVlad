# Roata Norocului — Casino Vlad

Site tip cazinou cu roată de premii. La prima vizită primești **1000 rotiri**.

## Premii

| Premiu | Fișier imagine |
|--------|----------------|
| Pupic | `public/assets/rewards/pupic.svg` |
| Îmbrățișare | `public/assets/rewards/imbratisare.svg` |
| Mângâiere | `public/assets/rewards/mangaiere.svg` |
| Backshots | `public/assets/rewards/backshots.svg` |

Înlocuiește fișierele de mai sus cu pozele tale (`.jpg` / `.png` / `.webp`). Dacă schimbi extensia, actualizează și căile din `public/app.js` (obiectul `REWARDS`).

## Local

```bash
npm install
npm start
```

Deschide http://localhost:3000

## Deploy pe Render

1. Creează repo pe GitHub și dă push la proiect.
2. Pe [Render](https://render.com) → **New** → **Web Service** → conectează repo-ul.
3. Setări:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Deploy.

Alternativ, dacă ai `render.yaml` în root, Render îl poate detecta automat.
