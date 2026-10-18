# Sécurité – Synapso

*Modèle de sécurité de l'app et règles à respecter. Mis à jour après l'audit d'octobre 2026.*

Synapso contient des données de santé (exercices de rééducation, journal, progrès) et permet de se créer un compte avec un code d'invitation. La règle de base : **un compte ne doit jamais pouvoir lire, modifier ou supprimer quoi que ce soit appartenant à un autre compte**.

---

## 1. Sessions

| Élément | Où |
|---|---|
| Création / vérification du jeton | `src/app/lib/auth-shared.ts` (`createSessionToken`, `parseSessionToken`, `isSessionSignatureValid`) |
| Résolution en base | `src/app/lib/session.ts` (`findSessionUser`, `resolveAuthState`) |
| Helpers pour les routes | `src/app/lib/auth.ts` (`getAuthContext`, `requireAuth`, `requireAdmin`, `getEffectiveUserId`) |

- Cookie `synapso_auth` = `userId.exp.signature` (HMAC-SHA256 avec `COOKIE_SECRET`), `httpOnly`, `secure` en prod, `sameSite=lax`.
- La signature couvre aussi le **hash du mot de passe** : changer de mot de passe invalide toutes les sessions ouvertes, sur tous les appareils.
- `exp` est vérifié **côté serveur** (30 jours), pas seulement par le navigateur.
- Chaque requête vérifie que le compte existe toujours (un compte supprimé est déconnecté).
- La session est résolue une seule fois par requête (cache `WeakMap` dans `auth.ts`).

**Impersonation admin** : cookie `synapso_impersonate` signé, ignoré si l'utilisateur connecté n'est pas `ADMIN`.

## 2. Rôle admin

- L'inscription crée **toujours** un compte `USER`.
- Promouvoir un compte : `npm run db:set-user-role -- <nom> ADMIN` (ajouter `--prod` pour la base de prod).

## 3. Règles pour toute nouvelle route API

1. **Authentifier** avec `getAuthContext(request)` (ou `requireAdmin` pour l'admin) et utiliser le `userId` qu'il renvoie. Ne jamais lire un `userId` dans le body ou l'URL.
2. **Filtrer par propriétaire** chaque lecture et écriture : `findFirst({ where: { id, userId } })`, jamais `findUnique({ where: { id } })` seul.
3. **Vérifier chaque ID venant du client** qui crée un lien vers une autre ressource (ex. `exerciceIds` d'une note → `getOwnedExerciceIds`).
4. **Valider le body avec zod** (`src/app/lib/validation.ts`).
5. **Ne pas renvoyer `error.message`** brut au client pour une erreur inattendue : logger avec `logError` et renvoyer un message générique.
6. Les données partagées entre tous les comptes (ex. parties du corps) ne sont modifiables que par un admin.

## 4. Médias (Cloudinary)

- Upload : `public_id` = `users/{userId}/{uuid}` (`uploadMedia`).
- Suppression : `deleteCloudinaryMedia(publicId, userId)` ne supprime **que** sous `users/{userId}/`. Les `publicId` stockés en base viennent du client, et un partage d'exercice copie ceux de l'expéditeur : sans ce garde-fou, un compte pourrait faire supprimer l'image d'un autre.
- Les anciens médias (dossier `exercices/`, sans propriétaire connu) ne sont plus supprimés automatiquement et deviennent orphelins dans Cloudinary.

## 5. Rate limiting

`src/app/lib/rate-limit.ts`, appliqué par `src/middleware.ts` (désactivé en `next dev`) :

| Type | Clé | Limite |
|---|---|---|
| `auth` (login + inscription) | IP | 5 / 15 min |
| `loginName` (dans la route login) | nom du compte | 10 / 15 min |
| `upload` | IP | 30 / h |
| `api` | IP | 100 / min |

- IP lue dans `x-nf-client-connection-ip` (posé par Netlify, non falsifiable). `x-forwarded-for` n'est qu'un dernier recours.
- **Upstash Redis requis en prod** (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) : sans lui, le compteur est en mémoire par instance de fonction, donc presque inefficace.

## 6. En-têtes

Définis dans `next.config.ts` : HSTS, `X-Frame-Options`, `nosniff`, CSP (`unsafe-eval` uniquement en dev, images limitées à Cloudinary, `frame-ancestors 'none'`).

## 7. Points connus, non traités

- **Liste des comptes** : `GET /api/shares/users` donne le nom de tous les comptes à n'importe quel utilisateur connecté (pour le partage). C'est un choix produit à trancher (partage par nom exact ou par code ?).
- **Partages non sollicités** : n'importe quel compte peut envoyer un exercice à n'importe quel autre.
- **`/api/equipments`** agrège les équipements de tous les comptes (autocomplétion). Peu sensible.
- **Dépendances** : 4 alertes `npm audit` restantes, dans l'outillage CLI de Prisma (`effect`, `deepmerge-ts`), pas dans le code exécuté par les routes. Elles partiront avec une montée de version de Prisma.
