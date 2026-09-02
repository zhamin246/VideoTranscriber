import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  
  // 添加路径头信息，供布局文件使用
  if (response) {
    response.headers.set('x-pathname', request.nextUrl.pathname);
  }
  
  return response;
}

export const config = {
  matcher: [
    "/",
    "/(en)/:path*",
    "/((?!api/|_next|_vercel|.*\\..*).*)",
  ],
};
