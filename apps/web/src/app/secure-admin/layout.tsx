// src/app/secure-admin/layout.tsx
export default function SecureAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-4 py-2 text-sm">
        ⚠️ Адміністративна панель - тільки для авторизованих користувачів
      </div>
      {children}
    </div>
  );
}