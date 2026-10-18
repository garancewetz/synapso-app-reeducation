# Plan - Mode hors connexion (Axe 3)

Objectif : rendre l'app utilisable sans connexion — lecture des données récentes, création/édition locale, sync au reconnect.

## État actuel constaté

### Déjà en place
- [public/manifest.json](../public/manifest.json) configuré (standalone, icons, shortcuts)
- [public/sw.js](../public/sw.js) : service worker avec strategy Cache-First pour assets statiques, Network-First pour HTML
- [public/offline.html](../public/offline.html) : page de fallback
- Metadata PWA dans [src/app/layout.tsx](../src/app/layout.tsx)

### Bloquants pour le mode offline
- **[public/sw.js:72-87](../public/sw.js#L72-L87)** : tous les `/api/*` échouent offline (réponse 503 JSON générique) → rien n'est lisible
- **Aucun stockage applicatif** : ni `localStorage`, ni `IndexedDB`, ni `persistQueryClient`
- **Auth cookie httpOnly signé** : la session n'est pas accessible en JS → incompatible avec des décisions client offline
- **Cache TanStack Query** : en mémoire uniquement (`gcTime: 5min` par défaut) → perdu au refresh

### Routes API à offlinifier (37 routes)

**Lectures critiques (GET)** :
- `/api/exercices` (liste + `[id]`)
- `/api/history` — progression
- `/api/journal/notes` — notes du journal
- `/api/progress` — victoires
- `/api/stats/category` — stats par catégorie
- `/api/equipments` — métadonnées (peu changeantes)

**Écritures critiques (POST/PATCH/DELETE)** :
- `/api/exercices/[id]/complete` — complétion (mutation quotidienne principale)
- `/api/exercices` (POST) — nouvel exercice
- `/api/journal/notes` (POST/PATCH/DELETE) — journal
- `/api/progress` (POST) — nouvelle victoire
- `/api/exercices/[id]/pin`, `/api/journal/notes/[id]/validate` — flags

**Hors scope offline** : `/api/auth/*`, `/api/admin/*`, `/api/users/*`, uploads média (`/api/exercices/upload-media`)

---

## Phase 1 — MVP Lecture + Mutations en file (2-3 sprints)

Objectif : l'utilisateur lit son historique, complète un exercice et ajoute une note sans connexion. Sync au reconnect.

### 1.1 Persister le cache TanStack Query

**Dépendances à ajouter** :
```bash
npm i @tanstack/react-query-persist-client idb-keyval
```

**Fichier à modifier** : [src/app/providers/QueryProvider.tsx](../src/app/providers/QueryProvider.tsx) (ou équivalent)

Stratégie :
- `PersistQueryClientProvider` avec storage `idb-keyval` (IndexedDB sous le capot)
- `maxAge: 7 jours` pour la persistance
- Ne persister QUE les queries whitelistées (exercices, history, progress, journal) — pas les données utilisateur sensibles

**Fichier à créer** : `src/app/lib/offline/query-persister.ts`

### 1.2 Modifier le service worker pour lire depuis le cache API

**Fichier** : [public/sw.js](../public/sw.js)

Changer la stratégie des `/api/*` :
- Essayer réseau
- Si échec ET `method === 'GET'` ET route dans la whitelist → retourner la dernière réponse cachée depuis Cache Storage
- Sinon → 503 actuel (pour les mutations, voir 1.3)

**Whitelist** : `/api/exercices`, `/api/history`, `/api/journal/notes`, `/api/progress`, `/api/equipments`, `/api/stats/category`.

### 1.3 File de mutations offline

**Fichier à créer** : `src/app/lib/offline/mutation-queue.ts`

Pattern :
- Quand `navigator.onLine === false` et qu'une mutation est tentée, la queue la sérialise dans IndexedDB (`{ url, method, body, createdAt, clientId: uuid }`)
- Optimistic update côté client (TanStack Query gère ça nativement via `useMutation.onMutate`)
- Au `online` event, replay séquentiel avec retry exponentiel (5 s → 30 s → 2 min)
- Sur conflit serveur : logger + notifier l'utilisateur

**Wrapper à créer** : `src/app/lib/offline/useOfflineMutation.ts` qui remplace `useMutation` pour les 5-6 mutations critiques.

### 1.4 Session locale pour déblocage offline

Problème : l'auth cookie est httpOnly, le client ne peut pas savoir si la session est valide offline.

Solution pragmatique :
- Au login, écrire dans `localStorage` un flag `synapso_session_valid_until` = `now + 30 jours`
- Composants "gated" lisent ce flag → affichent l'UI si valide même offline
- Au reconnect, l'API valide vraiment le cookie côté serveur → si expiré, logout + redirect login
- **Ne contient aucune donnée sensible**, juste une indication "l'utilisateur est probablement encore connecté"

**Fichier à modifier** : [src/app/api/auth/login/route.ts](../src/app/api/auth/login/route.ts) (renvoyer `expiresAt` au client)
**Fichier à créer** : `src/app/lib/offline/session.ts`

### 1.5 Indicateur offline UI

**Fichier à créer** : `src/app/components/OfflineBanner.tsx`

- Écoute `window.online` / `window.offline`
- Affiche un bandeau discret "Mode hors ligne — vos actions seront synchronisées plus tard"
- Bouton "Réessayer maintenant"

À intégrer dans [src/app/layout.tsx](../src/app/layout.tsx).

### 1.6 Points durs Phase 1

| Problème | Mitigation |
|---|---|
| 2 onglets offline → double complétion du même exercice | UUID `clientId` local dans chaque mutation, idempotence côté serveur (check `clientId` avant insert) |
| Quota IndexedDB Safari (~50 MB) | Cleanup auto des entrées > 6 mois au démarrage |
| Service Worker stale après déploiement | Déjà géré : `skipWaiting()` + `clients.claim()` + `SW_UPDATED` message |
| Timezone sur le replay des mutations | Utiliser le `dateKey` stocké AVEC la mutation (voir [CLAUDE.md](../CLAUDE.md)) — jamais `new Date()` au replay |

---

## Phase 2 — Sync intelligent + conflits (2 sprints)

### 2.1 Stratégie de merge

**Fichier à créer** : `src/app/lib/offline/sync-engine.ts`

Politique par entité :
- **History / Progress** : append-only, pas de conflit possible — simple replay
- **Exercices** (édition) : last-write-wins sur `updatedAt` ; si divergence > seuil, demander à l'utilisateur
- **Notes journal** : conflit manuel (afficher les 2 versions, l'utilisateur choisit)

### 2.2 Edge cache pour les métadonnées quasi-statiques

`/api/equipments` change très rarement. Le passer via Netlify Edge avec `Cache-Control: max-age=86400`.

**Fichiers** : routes concernées + `netlify.toml` si besoin d'override.

### 2.3 Background sync API

Enregistrer un `sync` event quand une mutation est queue'd. Le SW le replay automatiquement quand la connexion revient, même si l'app est fermée.

**Fichier** : [public/sw.js](../public/sw.js) → ajouter handler `sync`
**Fallback navigateurs non supportés** (Safari) : polling léger via `setInterval` quand onglet actif.

---

## Phase 3 — Mutations complexes + média (2 sprints)

### 3.1 Upload média offline

Actuellement [src/app/api/exercices/upload-media/route.ts](../src/app/api/exercices/upload-media/route.ts) pousse direct sur Cloudinary.

Offline :
- Stocker le blob en IndexedDB (taille max : 10 MB/fichier, total 100 MB)
- Au reconnect : upload séquentiel avec progress UI + retry
- Afficher un placeholder local tant que l'upload n'est pas fini

**Fichier à créer** : `src/app/lib/offline/media-queue.ts`

### 3.2 Création complète d'exercices offline

Permettre de créer un exercice complet (avec catégorie, équipement, médias) sans connexion. Tout est stocké local puis sync au reconnect, avec IDs temporaires remplacés par les IDs serveur au retour de l'API.

### 3.3 UX de resolution des conflits

Modal dédiée affichée au reconnect quand des conflits sont détectés, laissant l'utilisateur choisir quelle version garder.

---

## Estimations

| Phase | Durée | Effort | Couverture |
|---|---|---|---|
| Phase 1 (MVP) | 2-3 sprints | 100 pts | ~80 % des cas d'usage |
| Phase 2 (sync) | 2 sprints | 80 pts | Robustesse multi-onglets |
| Phase 3 (complet) | 2 sprints | 60 pts | Création riche offline |

**Recommandation** : livrer Phase 1 d'abord et observer l'usage réel (combien d'utilisateurs passent en offline, quelle durée moyenne). Phase 2/3 seulement si l'usage le justifie.

---

## Fichiers impactés (synthèse)

### À créer
- `src/app/lib/offline/query-persister.ts`
- `src/app/lib/offline/mutation-queue.ts`
- `src/app/lib/offline/useOfflineMutation.ts`
- `src/app/lib/offline/session.ts`
- `src/app/lib/offline/sync-engine.ts` (Phase 2)
- `src/app/lib/offline/media-queue.ts` (Phase 3)
- `src/app/components/OfflineBanner.tsx`

### À modifier
- [public/sw.js](../public/sw.js) — stratégie cache API + background sync
- [src/app/providers/QueryProvider.tsx](../src/app/providers/QueryProvider.tsx) — persister
- [src/app/layout.tsx](../src/app/layout.tsx) — OfflineBanner
- [src/app/api/auth/login/route.ts](../src/app/api/auth/login/route.ts) — renvoyer `expiresAt`
- 5-6 hooks de mutations (`useCompleteExercice`, `useCreateNote`, etc.) → utiliser `useOfflineMutation`

### À ajouter (package.json)
- `@tanstack/react-query-persist-client`
- `idb-keyval` (ou `idb` pour plus de contrôle)
- `uuid` (pour les `clientId`)
