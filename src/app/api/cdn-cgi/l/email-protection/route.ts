import { NextRequest, NextResponse } from 'next/server';

/**
 * 处理 Cloudflare 邮件保护路径
 * 这个路径是 Cloudflare 自动生成的，用于保护页面中的邮件地址
 * 当用户直接访问这个路径时，我们重定向到首页或返回一个友好的错误页面
 */
export async function GET(request: NextRequest) {
  // 获取查询参数（如果有）
  const searchParams = request.nextUrl.searchParams;
  const emailParam = searchParams.get('email');
  
  // 如果有 email 参数，说明是 Cloudflare 的邮件保护链接
  // 这种情况下，我们应该返回一个说明页面或者重定向
  if (emailParam) {
    // 返回一个简单的 HTML 页面说明这是邮件保护链接
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Protection - Cloudflare</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 500px;
    }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; line-height: 1.6; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Email Protection</h1>
    <p>Este link é protegido pelo Cloudflare para evitar spam.</p>
    <p>Por favor, habilite JavaScript no seu navegador para decodificar o endereço de email.</p>
    <p><a href="/">Voltar para a página inicial</a></p>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
  
  // 如果没有参数，直接重定向到首页
  return NextResponse.redirect(new URL('/', request.url));
}

