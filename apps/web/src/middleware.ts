// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store
const ADMIN_RATE_LIMITS = new Map<string, number[]>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/secure-admin')) {
    // Отримання IP з headers
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Ваш IP адрес та локальні
    const allowedIPs = ['78.47.148.82', '127.0.0.1', 'localhost'];
    
    // Перевірка IP whitelist
    const isAllowed = allowedIPs.some(ip => clientIP.includes(ip));
    
    if (!isAllowed) {
      console.log(`Admin access blocked from IP: ${clientIP}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Rate limiting: 20 запитів за хвилину для адмін панелі
    const now = Date.now();
    const requests = ADMIN_RATE_LIMITS.get(clientIP) || [];
    const recentRequests = requests.filter(time => now - time < 60000); // Останні 60 секунд
    
    if (recentRequests.length >= 20) {
      console.log(`Admin rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Перевищено ліміт запитів. Спробуйте через хвилину.' }, 
        { status: 429 }
      );
    }
    
    // Додаємо поточний запит
    recentRequests.push(now);
    ADMIN_RATE_LIMITS.set(clientIP, recentRequests);
    
    // Очищення старих записів щоб не забивати пам'ять
    if (ADMIN_RATE_LIMITS.size > 100) {
      const oldestEntries = Array.from(ADMIN_RATE_LIMITS.entries())
        .sort(([,a], [,b]) => Math.min(...a) - Math.min(...b))
        .slice(0, 50);
      
      oldestEntries.forEach(([ip]) => ADMIN_RATE_LIMITS.delete(ip));
    }
    
    console.log(`Admin access granted for IP: ${clientIP}`);
  }
}

export const config = {
  matcher: '/secure-admin/:path*'
};