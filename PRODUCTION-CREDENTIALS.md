# RenderNest Production Credentials Checklist

This checklist tracks all infrastructure credentials, API keys, and cryptographically generated production secrets required to deploy and operate RenderNest.

> [!CAUTION]
> **NEVER COMMIT COMPLETED VALUES INTO GIT.**
> Store these securely in your password manager or secrets vault (e.g., Bitwarden, 1Password, Infisical, or Oracle Cloud Vault). Copy them directly into `/opt/rendernest/.env.production` on the production server.

---

## 1. Cloud & Server Infrastructure

| Key | Description | Status | Secret / Location Reference |
|---|---|---|---|
| `ORACLE_SSH_KEY` | Private SSH key for Ubuntu VM (`ssh -i key.pem ubuntu@<IP>`) | [ ] Pending | Stored locally |
| `ORACLE_VM_IP` | 130.210.47.93 | [x] Active | In Oracle Console |
| `DOMAIN_NAME` | Primary domain name (e.g., `rendernest.duckdns.org`) | [ ] Pending | In Registrar / Cloudflare |

---

## 2. Cloudflare & DNS

| Key | Description | Status | Secret / Location Reference |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Zone / DNS Edit token for DNS management | [ ] Pending | Cloudflare Dashboard |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone ID for the domain | [ ] Pending | Cloudflare Overview |

---

## 3. Cloudflare R2 Storage

| Key | Description | Status | Secret / Location Reference |
|---|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Account ID (hex string) | [ ] Pending | Cloudflare R2 Overview |
| `R2_ACCESS_KEY` | S3-compatible R2 Access Key ID | [ ] Pending | Cloudflare R2 API Tokens |
| `R2_SECRET_KEY` | S3-compatible R2 Secret Access Key | [ ] Pending | Cloudflare R2 API Tokens |
| `R2_BUCKET` | Production bucket name (e.g., `rendernest-production-artifacts`) | [ ] Pending | Created in R2 |
| `R2_PUBLIC_URL` | Optional custom domain or worker URL for artifact downloads | [ ] Optional | Configured in R2 |

---

## 4. Application Secrets (Generated via `scripts/generate-production-secrets.sh`)

| Key | Description | Status | Secret / Location Reference |
|---|---|---|---|
| `AUTH_SECRET` | NextAuth.js cryptographic session encryption secret | [ ] Pending | Run generator script |
| `STORAGE_SECRET` | HMAC signature secret for signed artifact URLs | [ ] Pending | Run generator script |
| `POSTGRES_PASSWORD` | Database password for user `RenderNest` | [ ] Pending | Run generator script |
| `RAPIDAPI_PROXY_SECRET` | RapidAPI Gateway Shared Secret (prevents spoofing) | [ ] Pending | Run generator script |

---

## 5. External Channels & Third-Party APIs

| Key | Description | Status | Secret / Location Reference |
|---|---|---|---|
| `RAPIDAPI_ACCOUNT` | RapidAPI Developer / Provider Portal login | [ ] Pending | rapidapi.com/provider |
| `OPENAI_API_KEY` | Optional OpenAI API Key for structured JSON extraction fallback | [ ] Optional | platform.openai.com |
| `STRIPE_SECRET_KEY` | Stripe secret key (Keep disabled for initial RapidAPI launch) | [ ] Disabled | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (Disabled for initial launch) | [ ] Disabled | dashboard.stripe.com |

---

## 6. Verification Checklist

- [ ] All passwords generated with at least 32 bytes of cryptographically secure entropy (`openssl rand -hex 32`).
- [ ] `.env.production` on the production server has permissions set to `chmod 600`.
- [ ] File ownership on the server set to `chown ubuntu:ubuntu /opt/rendernest/.env.production`.
- [ ] Git status verifies no untracked `.env` or secret files are present before committing.
