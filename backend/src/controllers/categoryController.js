import { Category, Video } from '../sequelize.js';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['order', 'ASC'], ['name', 'ASC']],
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and slug are required' 
      });
    }

    // Get max order
    const maxOrder = await Category.max('order') || 0;

    const category = await Category.create({
      name,
      slug: slug.toLowerCase(),
      order: maxOrder + 1,
      isDefault: false,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name or slug already exists' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    await category.update({
      name: name || category.name,
      slug: slug ? slug.toLowerCase() : category.slug,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name or slug already exists' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Check if it's a default category
    if (category.isDefault) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete default category' 
      });
    }

    // Check if category has videos (using category slug, not categoryId)
    const videoCount = await Video.count({ where: { category: category.slug } });
    if (videoCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category with ${videoCount} video(s). Please move or delete videos first.` 
      });
    }

    await category.destroy();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reorder categories
export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, order }

    if (!Array.isArray(categories)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Categories must be an array' 
      });
    }

    // Update each category's order
    await Promise.all(
      categories.map(({ id, order }) => 
        Category.update({ order }, { where: { id } })
      )
    );

    const updated = await Category.findAll({
      order: [['order', 'ASC']],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
