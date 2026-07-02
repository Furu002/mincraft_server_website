# Auth API

The default development setup uses a local file-backed auth API so signup and
login work without creating AWS resources.

```powershell
npm run dev:local
```

Local endpoints:

```env
VITE_AUTH_API_BASE=http://127.0.0.1:4174
```

Local auth data is stored in `.local/auth/` and is ignored by git. The local
pepper key is generated on first run and is only for development.

The website uses `VITE_AUTH_API_BASE` for real account signup and login.

```env
VITE_AUTH_API_BASE=https://api-id.execute-api.ap-northeast-1.amazonaws.com
```

Do not put database keys or auth pepper values in Vite variables. `VITE_*` values are public in the browser.

Production deploys create or update the AWS auth backend before building the
site. The deploy workflow writes the generated API endpoint to
`.env.auth.generated` and exports it as `VITE_AUTH_API_BASE` for the Vite build,
so the deployed site is built against the real signup/login API.

The auth backend also sends email verification and password reset messages with
Amazon SES. By default it uses `no-reply@nfoifsb.kr`; set `AUTH_EMAIL_FROM` to
override it. The sender identity must be verified in SES before real users can
receive mail.

## AWS Resources

AWS setup is blocked by default so it cannot accidentally create billable
resources. To intentionally use AWS, set `ALLOW_AWS_COSTS=1` for the command or
GitHub Actions workflow run.

```powershell
$env:ALLOW_AWS_COSTS="1"
npm run auth:setup:aws
```

`npm run auth:setup:aws` creates or updates:

- DynamoDB table for users
- Lambda function for `signup`, `login`, and `reset`
- IAM role with DynamoDB user table access and SES email send access
- HTTP API Gateway routes
- Lambda `AUTH_PEPPER` stored in the encrypted Lambda environment

Generated output:

```text
auth-output.json
.env.auth.generated
```

Both files are ignored by git.

## Endpoints

### Sign Up

```http
POST /auth/signup
Content-Type: application/json
```

```json
{
  "nickname": "PlayerName",
  "email": "player@example.com",
  "password": "minimum-8-characters"
}
```

Response:

```json
{
  "message": "인증 메일을 보냈습니다. 이메일 인증 후 로그인할 수 있습니다.",
  "verificationRequired": true
}
```

### Verify Email

```http
POST /auth/verify-email
Content-Type: application/json
```

```json
{
  "email": "player@example.com",
  "code": "123456"
}
```

The `token` from an emailed link can be sent instead of `code`.

### Resend Verification

```http
POST /auth/resend-verification
Content-Type: application/json
```

```json
{
  "email": "player@example.com"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "player@example.com",
  "password": "minimum-8-characters"
}
```

### Reset

```http
POST /auth/reset
Content-Type: application/json
```

```json
{
  "email": "player@example.com"
}
```

The reset endpoint returns a generic success response so it does not reveal whether an email exists.

### Confirm Reset

```http
POST /auth/reset/confirm
Content-Type: application/json
```

```json
{
  "email": "player@example.com",
  "code": "123456",
  "password": "new-minimum-8-characters"
}
```

The `token` from an emailed reset link can be sent instead of `code`.

### Google Login

```http
POST /auth/google
Content-Type: application/json
```

```json
{
  "credential": "google-id-token"
}
```

The Lambda verifies the Google ID token signature, issuer, audience, expiry, and
verified email claim before issuing a site session.
