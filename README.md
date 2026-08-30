# Botanic Inventory

Lehký statický WMS prototyp pro sklad surovin. Běží bez backendu a je připravený pro GitHub Pages.

## GitHub Pages

Projekt obsahuje `index.html`, `.nojekyll` a workflow `.github/workflows/pages.yml`, které publikuje celý repozitář jako statický Pages artifact při pushi do `main`. GitHub Pages pro tento typ workflow vyžaduje jako publishing source **GitHub Actions**. V repozitáři tedy stačí v **Settings → Pages → Build and deployment → Source** zvolit **GitHub Actions**. citeturn257042search1turn257042search2

## Funkce

- jednotná navigace mezi Dashboard / Sklad / Historie / Příjem / Výdej / Přesuny
- lokální datový model přes `localStorage`
- automatické generování ID nového packu
- příjem nové zásoby a vytvoření auditní události
- FIFO doporučení pro výdej podle nejbližší expirace
- validace výdeje proti aktuální hmotnosti
- přesun packu do jiného boxu
- přesun boxu včetně aktualizace pozic jeho packů
- živý přehled skladu a vyhledávání
- auditní historie a export CSV
- responzivní zobrazení pro telefon i desktop
- podpora `prefers-reduced-motion`

## Spuštění lokálně

```bash
npm install
npm run dev
```

Bez Node.js lze aplikaci otevřít přímo přes jednoduchý statický server, protože frontend nemá build krok ani backend.

## Struktura

```text
/
├── index.html
├── Dashboard.html
├── Výdej (Issuance).html
├── Příjem (Receipt).html
├── Přesun packu (Pack Move).html
├── Přesun boxu (Box Move).html
├── Přehled skladu (Warehouse Overview).html
├── Detail packu (Pack Detail).html
├── Detail suroviny (Material Detail).html
├── Historie (History).html
├── script.js
├── styles.css
├── package.json
├── .nojekyll
└── .github/workflows/pages.yml
```

## Datová vrstva

Data jsou záměrně lokální, aby aplikace fungovala i na GitHub Pages. Stav je uložen v browseru pod klíčem `botanic-inventory:v2`. Pro reset testovacích dat lze v konzoli použít:

```js
InventoryApp.reset()
```

Pro čtení aktuálního stavu:

```js
InventoryApp.getState()
```

Export historie:

```js
InventoryApp.exportCsv()
```

## Poznámka k produkčnímu WMS

Tato verze je frontendový prototyp. Pro více uživatelů, synchronizaci mezi zařízeními, autentizaci a append-only centrální auditní log je potřeba připojit API + databázi (např. PostgreSQL/Supabase).