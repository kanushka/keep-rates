const ranges = [
    { label: '14 Days', value: '14d' },
    { label: '30 Days', value: '30d' },
    { label: '60 Days', value: '60d' },
    { label: '1 Year', value: '1y' },
  ];
  
  export const DateRangeFilter = ({ onChange }: { onChange: (range: string) => void }) => {
    return (
      <div className="flex gap-2">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            {range.label}
          </button>
        ))}
      </div>
    );
  };
