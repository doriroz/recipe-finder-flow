interface Dish {
  id: number;
  name: string;
  date: string;
  emoji: string;
}

interface DishCardProps {
  dish: Dish;
}

const DishCard = ({ dish }: DishCardProps) => {
  return (
    <div className="card-warm hover:shadow-elevated transition-all duration-300 cursor-pointer group">
      <div className="aspect-square bg-cream rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
        <span className="text-6xl">{dish.emoji}</span>
      </div>
      <h3 className="font-semibold text-foreground mb-1 truncate">{dish.name}</h3>
      <p className="text-sm text-muted-foreground">{dish.date}</p>
    </div>
  );
};

export default DishCard;
