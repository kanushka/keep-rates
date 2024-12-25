interface RateSummaryProps {
    title: string;
    value: string;
    color?: string;
  }
  
  export const RateSummaryCard = ({ title, value, color = 'text-gray-900' }: RateSummaryProps) => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className={`text-2xl font-bold ${color} mt-2`}>{value}</p>
      </div>
    );
  };
