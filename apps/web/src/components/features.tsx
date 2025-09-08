// src/components/features.tsx
export function Features() {
  const features = [
    {
      icon: '⚡',
      title: 'Найшвидше відстеження',
      description: 'Результат за менше 1 секунди'
    },
    {
      icon: '🔄',
      title: 'Multi-source перевірка',
      description: 'Перевіряємо у всіх джерелах'
    },
    {
      icon: '📱',
      title: 'Зручно на телефоні',
      description: 'Оптимізовано для мобільних'
    },
    {
      icon: '🇺🇦',
      title: 'Українська локалізація',
      description: 'Повністю українською мовою'
    }
  ]

  return (
    <section className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        🎯 Чому PandaTrack?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-[20px] p-6 text-center">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-[#333037]/60">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}