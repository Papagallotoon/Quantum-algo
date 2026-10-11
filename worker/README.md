# Inscriptions à la newsletter (Cloudflare Worker, gratuit)

Ce petit service reçoit les inscriptions du site, garde les adresses dans un espace
**privé** de ton compte Cloudflare et donne la liste à la routine du matin.
Chaque lettre contient un lien de désinscription personnel.

## Installation (une seule fois, ~10 minutes)

Dans PowerShell, depuis le dossier du projet :

```powershell
cd worker
npx wrangler login                          # ouvre le navigateur, connecte-toi à Cloudflare
npx wrangler kv namespace create SUBS       # affiche un "id" : copie-le
```

Ouvre `worker\wrangler.toml` et remplace `REMPLACER_PAR_L_ID_KV` par cet id. Puis :

```powershell
npx wrangler secret put SECRET              # tape une longue phrase au hasard (sert aux liens de désinscription)
npx wrangler secret put ADMIN_TOKEN         # tape un autre mot de passe long : note-le
npx wrangler deploy                         # affiche l'adresse du service, ex. https://quantum-algo-newsletter.TONCOMPTE.workers.dev
```

## Brancher le service

1. Dans `server\config.json`, ajoute la ligne : `"subscribeApi": "https://quantum-algo-newsletter.TONCOMPTE.workers.dev",`
2. Sur GitHub → Settings → Secrets and variables → Actions, crée :
   - `SUBSCRIBE_API` = la même adresse
   - `SUBSCRIBE_TOKEN` = le mot de passe choisi pour `ADMIN_TOKEN`
3. Envoie le code (`git add . / commit / pull --rebase / push`) et lance **Run workflow**.

## Voir le nombre d'inscrits

```powershell
curl.exe -H "Authorization: Bearer TON_ADMIN_TOKEN" https://quantum-algo-newsletter.TONCOMPTE.workers.dev/list
```

Limite : Gmail accepte environ 500 envois par jour depuis un compte personnel.
Au-delà, il faudra passer par un service d'envoi dédié.
