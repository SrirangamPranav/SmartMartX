interface PriceDisplayProps {
  price: number;
  className?: string;
}

export const PriceDisplay = ({ price, className = "" }: PriceDisplayProps) => {
  return (
    <span className={`font-semibold ${className}`}>
      ₹{price.toFixed(2)}
    </span>
  );
};
