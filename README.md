# nfoifsb.kr Minecraft Website

Minecraft 서버와 웹사이트가 같은 도메인에서 충돌하지 않게 분리해서 운영한다.

## Domain Rule

절대 바꾸면 안 되는 기본 규칙:

```text
nfoifsb.kr      -> Minecraft 서버 접속 주소
www.nfoifsb.kr  -> 웹사이트 주소
```

현재 확인된 Minecraft 루트 도메인 DNS:

```text
Type: A
Host: @
Value: 114.201.255.139
```

`nfoifsb.kr` 루트 A 레코드는 Minecraft 서버용이다. 이 값을 CloudFront, S3, AWS 웹사이트 IP로 바꾸면 Minecraft 접속이 깨질 수 있다.

웹사이트는 아래 CloudFront 배포를 사용한다.

```text
https://d199dteepu5fz2.cloudfront.net/
```

커스텀 웹 주소를 붙일 때는 `www.nfoifsb.kr`만 사용한다.

## Gabia DNS

Gabia DNS에는 최종적으로 이렇게 둔다.

```text
Type   Host  Value
A      @     114.201.255.139
CNAME  www   d199dteepu5fz2.cloudfront.net.
```

중요:

- `@` 또는 빈 호스트의 A 레코드는 Minecraft 서버용이다.
- `www` CNAME만 웹사이트용이다.
- `nfoifsb.kr` 루트에 CloudFront CNAME을 넣지 않는다.
- `nfoifsb.kr` 루트 A 레코드를 삭제하지 않는다.

## AWS CloudFront Custom Domain

`www.nfoifsb.kr`로 HTTPS 웹사이트를 열려면 CloudFront에도 `www.nfoifsb.kr`를 등록해야 한다.

필요한 AWS 설정:

1. ACM 인증서를 `us-east-1` 리전에 만든다.
2. 인증서 도메인은 `www.nfoifsb.kr`로 만든다.
3. ACM이 주는 DNS validation CNAME을 Gabia에 추가한다.
4. 인증서가 발급되면 CloudFront distribution의 Alternate domain name에 `www.nfoifsb.kr`를 추가한다.
5. CloudFront viewer certificate로 위 ACM 인증서를 선택한다.
6. Gabia에 `www -> d199dteepu5fz2.cloudfront.net.` CNAME을 추가한다.

이 순서를 지켜야 `https://www.nfoifsb.kr`가 정상 동작한다.

## Local Development

```powershell
npm install
npm run dev
```

Local URL:

```text
http://127.0.0.1:5173/
```

## Build

```powershell
npm run build
```

Build output is created in `dist/`.

## Deploy

AWS credentials are required before running the deploy script.

```powershell
$env:AWS_ACCESS_KEY_ID="..."
$env:AWS_SECRET_ACCESS_KEY="..."
$env:AWS_REGION="ap-northeast-2"
npm run deploy:aws
```

Optional custom domain deploy:

```powershell
$env:SITE_DOMAIN="www.nfoifsb.kr"
$env:CERTIFICATE_ARN="arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID"
npm run deploy:aws
```

Keep `nfoifsb.kr` reserved for Minecraft. Use `www.nfoifsb.kr` for the website.
