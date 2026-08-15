# FANCAFE ARCHIVE

Samodzielne, statyczne archiwum Fancafe THE BOYZ, gotowe do publikacji jako GitHub Pages.

## Sekcje

- `FROM THE BOYZ` — 1 443 posty z filtrowaniem według członka i roku. Tekst 1 442 publicznych dokumentów Google Docs jest zapisany w repozytorium i wyświetlany bezpośrednio jako artykuły blogowe. Obrazy osadzone w dokumentach i ich oryginalne formatowanie są dostępne przez przycisk `OPEN ORIGINAL`; jedyny plik PDF korzysta z osadzonego podglądu.
- `THE BOYZ ALBUM` — 137 galerii i 2 733 zdjęcia z wyszukiwaniem, filtrowaniem i pełnoekranową galerią.

Interfejs jest dostępny wyłącznie w języku angielskim. Oryginalne koreańskie tytuły i treści postów pozostają częścią archiwum.

## Test i kompilacja

Wymagany jest Node.js 22.

```bash
npm test
npm run build
```

Gotowa strona zostanie utworzona w katalogu `dist`.

## Odświeżanie treści dokumentów

Skrypt ponownie pobiera publiczne dokumenty Google Docs i aktualizuje `from-the-boyz/content.js`:

```bash
node scripts/fetch-post-content.mjs
```

## Publikacja GitHub Pages

1. Utwórz puste repozytorium GitHub, na przykład `fancafe-archive`.
2. W folderze projektu wykonaj:

   ```bash
   git remote add origin https://github.com/TWOJ_LOGIN/fancafe-archive.git
   git push -u origin main
   ```

3. W GitHub otwórz `Settings → Pages`.
4. Ustaw `Build and deployment → Source → GitHub Actions`.

Workflow `Deploy GitHub Pages` zbuduje i opublikuje statyczną stronę.
