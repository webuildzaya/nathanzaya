export default function TimeSlotPicker({ 
  slots, 
  value, 
  onChange 
}: { 
  slots: { time: string; available: boolean }[] | undefined
  value: string
  onChange: (v: string) => void
}) {
  if (!slots) return <div className="text-sm text-gray-500">Loading slots...</div>
  if (slots.length === 0) return <div className="text-sm text-gray-500">No slots available on this date.</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {slots.map(s => {
        const d = new Date(s.time)
        const display = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const selected = value === s.time
        
        return (
          <button
            key={s.time}
            type="button"
            disabled={!s.available}
            onClick={() => onChange(s.time)}
            className={`
              h-12 md:h-10 px-2 rounded-xl text-sm font-medium transition-colors border select-none active:scale-95
              ${selected ? 'bg-blue-600 text-white border-blue-600' : 
                s.available ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50' : 
                'bg-gray-50 border-gray-100 text-gray-400 opacity-60 cursor-not-allowed'}
            `}
          >
            {display}
          </button>
        )
      })}
    </div>
  )
}
