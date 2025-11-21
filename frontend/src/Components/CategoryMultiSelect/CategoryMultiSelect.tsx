import React from "react";
import { Category } from "../../services/categoryService";
import "./CategoryMultiSelect.css";

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedCategoryIds: number[];
  onChange: (categoryIds: number[]) => void;
  error?: string;
  disabled?: boolean;
}

const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  categories,
  selectedCategoryIds,
  onChange,
  error,
  disabled = false,
}) => {
  const handleToggle = (categoryId: number) => {
    if (disabled) return;

    const isSelected = selectedCategoryIds.includes(categoryId);
    let newSelection: number[];

    if (isSelected) {
      newSelection = selectedCategoryIds.filter((id) => id !== categoryId);
    } else {
      newSelection = [...selectedCategoryIds, categoryId];
    }

    onChange(newSelection);
  };

  return (
    <div className="category-multi-select">
      <h3 className="category-label">
        Categorías del negocio <span className="required">*</span>
      </h3>
      
      {error && <div className="category-error">{error}</div>}
      
      <div className="category-grid">
        {categories.map((category) => {
          const isSelected = selectedCategoryIds.includes(category.category_id);
          return (
            <div
              key={category.category_id}
              className={`category-chip ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
              onClick={() => handleToggle(category.category_id)}
              title={category.description}
            >
              <div className="category-check">
                {isSelected && <i className="fas fa-check"></i>}
              </div>
              <span className="category-name">{category.name}</span>
            </div>
          );
        })}
      </div>
      
      <p className="category-hint">
        {selectedCategoryIds.length === 0 
          ? "Selecciona al menos una categoría" 
          : `${selectedCategoryIds.length} categoría${selectedCategoryIds.length > 1 ? "s" : ""} seleccionada${selectedCategoryIds.length > 1 ? "s" : ""}`
        }
      </p>
    </div>
  );
};

export default CategoryMultiSelect;
