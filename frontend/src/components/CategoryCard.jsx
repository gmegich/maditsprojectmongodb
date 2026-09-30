import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  if (!category) {
    return (
      <article className="category-card category-card--placeholder">
        <h3>Category</h3>
        <p>Available once categories are seeded</p>
      </article>
    );
  }

  return (
    <Link to={`/products?category=${category._id}`} className="category-card">
      <h3>{category.name}</h3>
      <p>{category.description}</p>
    </Link>
  );
};

export default CategoryCard;
