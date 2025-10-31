import React, { useState, useEffect } from 'react';
import './CategoryManager.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      setError('Error loading categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const url = editingId 
      ? `/api/v1/categories/${editingId}`
      : '/api/v1/categories';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        setFormData({ name: '', slug: '' });
        setShowAddForm(false);
        setEditingId(null);
      } else {
        alert(data.message || 'Failed to save category');
      }
    } catch (err) {
      alert('Error saving category');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        setDeleteConfirm(null);
      } else {
        alert(data.message || 'Failed to delete category');
        setDeleteConfirm(null);
      }
    } catch (err) {
      alert('Error deleting category');
      console.error(err);
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, slug: category.slug });
    setShowAddForm(true);
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = 
      [newCategories[index], newCategories[index - 1]];
    
    await updateOrder(newCategories);
  };

  const handleMoveDown = async (index) => {
    if (index === categories.length - 1) return;
    
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = 
      [newCategories[index + 1], newCategories[index]];
    
    await updateOrder(newCategories);
  };

  const updateOrder = async (newCategories) => {
    const token = localStorage.getItem('token');
    const orderedCategories = newCategories.map((cat, idx) => ({
      id: cat.id,
      order: idx,
    }));

    try {
      const response = await fetch('/api/v1/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: orderedCategories }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error reordering:', err);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  if (loading) {
    return <div className="category-manager-loading">Loading categories...</div>;
  }

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <h2>📂 Manage Categories</h2>
        <button 
          className="add-category-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData({ name: '', slug: '' });
          }}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {error && <div className="category-error">{error}</div>}

      {showAddForm && (
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Sports, Documentary"
                required
              />
            </div>
            <div className="form-group">
              <label>Slug (auto-generated)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., sports, documentary"
                required
              />
            </div>
          </div>
          <button type="submit" className="save-category-btn">
            {editingId ? '💾 Update Category' : '✓ Add Category'}
          </button>
        </form>
      )}

      <div className="categories-list">
        {categories.length === 0 ? (
          <p className="no-categories">No categories yet. Add one to get started!</p>
        ) : (
          categories.map((category, index) => (
            <div key={category.id} className="category-item">
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="category-slug">/{category.slug}</span>
                {category.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </div>
              
              <div className="category-actions">
                <button
                  className="action-btn move-btn"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="action-btn move-btn"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === categories.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEdit(category)}
                  title="Edit"
                >
                  ✎
                </button>
                {!category.isDefault && (
                  <button
                    className="action-btn delete-btn"
                    onClick={() => setDeleteConfirm(category)}
                    title="Delete"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Delete Category</h3>
            <p>
              Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"?
            </p>
            <p className="warning-text">
              This action cannot be undone. Make sure no videos are using this category.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={() => handleDelete(deleteConfirm.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
