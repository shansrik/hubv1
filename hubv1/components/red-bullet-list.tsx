interface RedBulletListProps {
  items: string[]
}

export default function RedBulletList({ items }: RedBulletListProps) {
  return (
    <ul className="list-none pl-4 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <span className="text-red-600 mr-2 mt-1.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

