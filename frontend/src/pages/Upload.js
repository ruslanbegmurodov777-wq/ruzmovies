import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api"; // Import the configured api instance
import { 
  getVideoType, 
  getYouTubeVideoId, 
  getYouTubeThumbnail, 
  getVimeoVideoId, 
  getVimeoThumbnail,
  validateVideoUrl
} from "../utils/videoUtils"; // Import video utility functions
import "./Upload.css";

const Upload = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category: 'movies'
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState(''); // 'file' or 'url'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      setVideoFile(files[0]);
      setUploadMethod('file');
      // Clear URL when file is selected
      setFormData(prev => ({ ...prev, url: '' }));
    } else {
      setVideoFile(null);
      // Only reset uploadMethod if no URL is present
      if (!formData.url) {
        setUploadMethod('');
      }
    }
  }, [formData.url]);

  const handleThumbnailFileChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      setThumbnailFile(files[0]);
      // Clear thumbnail URL when file is selected
      setFormData(prev => ({ ...prev, thumbnail: '' }));
    } else {
      setThumbnailFile(null);
    }
  }, []);

  const handleUrlChange = useCallback((e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      url: value
    });

    // Set upload method to URL when URL is entered
    if (value) {
      setUploadMethod('url');
      // Clear file when URL is entered
      setVideoFile(null);
    } else if (!videoFile) {
      // Only reset uploadMethod if no file is present
      setUploadMethod('');
    }

    // Auto-generate thumbnail for YouTube and Vimeo videos
    if (value) {
      const videoType = getVideoType(value);
      
      if (videoType === 'youtube') {
        const videoId = getYouTubeVideoId(value);
        if (videoId) {
          const thumbnail = getYouTubeThumbnail(videoId);
          setFormData(prev => ({ ...prev, url: value, thumbnail }));
        }
      } else if (videoType === 'vimeo') {
        const videoId = getVimeoVideoId(value);
        if (videoId) {
          // Handle Vimeo thumbnail asynchronously
          getVimeoThumbnail(videoId)
            .then(thumbnail => {
              setFormData(prev => ({ ...prev, url: value, thumbnail }));
            })
            .catch(error => {
              // Silently handle error
            });
        }
      }
    }
  }, [formData, videoFile]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate either URL or file is provided
    if (!formData.url && !videoFile) {
      setError('Please provide either a video URL or upload a video file');
      return;
    }
    
    // If URL is provided, validate it
    if (formData.url && !validateVideoUrl(formData.url)) {
      setError('Please enter a valid YouTube, Vimeo, or direct video URL');
      return;
    }
    
    // If it's a file upload, check if title is provided
    if (videoFile && !formData.title.trim()) {
      setError('Title is required for file uploads');
      return;
    }
    
    setLoading(true);

    try {
      let response;
      
      if (videoFile) {
        // Handle file upload
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        
        // Only append thumbnail if it's provided
        if (formData.thumbnail) {
          formDataObj.append('thumbnail', formData.thumbnail);
        }
        
        formDataObj.append('videoFile', videoFile);
        
        // Append thumbnail file if provided
        if (thumbnailFile) {
          formDataObj.append('thumbnailFile', thumbnailFile);
        }
        
        response = await api.post('/videos', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Handle URL upload
        // Make sure all required fields are provided
        if (!formData.title.trim()) {
          setError('Title is required');
          setLoading(false);
          return;
        }
        
        if (!formData.thumbnail) {
          setError('Thumbnail is required for URL uploads');
          setLoading(false);
          return;
        }
        
        response = await api.post('/admin/videos', formData);
      }
      
      setSuccess('Video uploaded successfully!');
      setTimeout(() => {
        navigate(`/video/${response.data.data.id}`);
      }, 2000);
    } catch (error) {
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        if (error.response.data && error.response.data.message) {
          setError(`Upload failed: ${error.response.data.message}`);
        } else {
          setError(`Upload failed: ${error.response.statusText} (${error.response.status})`);
        }
      } else if (error.request) {
        // Request was made but no response received
        setError('Upload failed: No response from server. Please check your connection.');
      } else {
        // Something else happened
        setError(`Upload failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, videoFile, thumbnailFile, navigate]);

  const uploadTips = useMemo(() => (
    <div className="upload-tips">
      <h3>Upload Tips:</h3>
      <ul>
        <li>Use a descriptive title for better discoverability</li>
        <li>You can either upload a video file directly or provide a URL</li>
        <li><strong>YouTube:</strong> Copy the video URL from the address bar</li>
        <li><strong>Vimeo:</strong> Copy the video URL from the address bar</li>
        <li><strong>Direct videos:</strong> Make sure the URL is publicly accessible</li>
        <li>Thumbnails are auto-generated for YouTube/Vimeo</li>
        <li>Add a detailed description to help viewers</li>
        <li>For uploaded files, thumbnails can be customized</li>
      </ul>
    </div>
  ), []);

  const accessMessage = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <div className="upload-page">
          <div className="upload-container">
            <div className="error">Please login to access this page</div>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="upload-page">
          <div className="upload-container">
            <div className="error">Admin access required</div>
          </div>
        </div>
      );
    }

    return null;
  }, [isAuthenticated, isAdmin]);

  if (accessMessage) return accessMessage;

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-card">
          <h2>Admin Video Upload</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter video title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter video description"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="movies">Movies</option>
                <option value="music">Music</option>
                <option value="dramas">Dramas</option>
                <option value="cartoons">Cartoons</option>
              </select>
            </div>

            {/* Method Selection */}
            <div className="form-group">
              <label>Upload Method</label>
              <div className="upload-method-selector">
                <button
                  type="button"
                  className={`method-button ${uploadMethod === 'file' ? 'active' : ''}`}
                  onClick={() => {
                    setUploadMethod('file');
                    setFormData(prev => ({ ...prev, url: '' }));
                  }}
                >
                  Upload Video File
                </button>
                <button
                  type="button"
                  className={`method-button ${uploadMethod === 'url' ? 'active' : ''}`}
                  onClick={() => {
                    setUploadMethod('url');
                    setVideoFile(null);
                  }}
                >
                  Video URL
                </button>
              </div>
            </div>

            {/* File Upload Section - Only shown when file method is selected */}
            {uploadMethod === 'file' && (
              <div className="form-group file-upload-section">
                <label htmlFor="videoFile">Upload Video File</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id="videoFile"
                    name="videoFile"
                    onChange={handleFileChange}
                    accept="video/*"
                    className="file-input"
                  />
                  <label htmlFor="videoFile" className="file-label">
                    <span className="file-label-text">
                      {videoFile ? 'Change File' : 'Choose Video File'}
                    </span>
                    {videoFile && (
                      <span className="file-name">{videoFile.name}</span>
                    )}
                  </label>
                </div>
                <small className="form-help">
                  Select a video file to upload directly to the server (MP4, WebM, MOV, etc.)
                </small>
                {videoFile && (
                  <div className="file-info">
                    Selected file: {videoFile.name} ({Math.round(videoFile.size / 1024 / 1024 * 100) / 100} MB)
                  </div>
                )}
              </div>
            )}

            {/* URL Section - Only shown when URL method is selected */}
            {uploadMethod === 'url' && (
              <div className="form-group">
                <label htmlFor="url">Video URL *</label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleUrlChange}
                  required
                  placeholder="YouTube, Vimeo, or direct video URL"
                />
                <small className="form-help">
                  Supported formats:
                  <br />• YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
                  <br />• Vimeo: https://vimeo.com/VIDEO_ID
                  <br />• Direct: Direct link to video file (mp4, webm, etc.)
                </small>
                {formData.url && (
                  <div className="url-validation">
                    {validateVideoUrl(formData.url) ? (
                      <span className="validation-success">✓ Valid {getVideoType(formData.url)} URL</span>
                    ) : (
                      <span className="validation-error">✗ Invalid video URL format</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Section - Only shown when file method is selected */}
            {uploadMethod === 'file' && (
              <div className="form-group file-upload-section">
                <label htmlFor="thumbnailFile">Upload Thumbnail (Optional)</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id="thumbnailFile"
                    name="thumbnailFile"
                    onChange={handleThumbnailFileChange}
                    accept="image/*"
                    className="file-input"
                  />
                  <label htmlFor="thumbnailFile" className="file-label">
                    <span className="file-label-text">
                      {thumbnailFile ? 'Change Thumbnail' : 'Choose Thumbnail'}
                    </span>
                    {thumbnailFile && (
                      <span className="file-name">{thumbnailFile.name}</span>
                    )}
                  </label>
                </div>
                <small className="form-help">
                  Select a thumbnail image to upload directly to the server (JPG, PNG, etc.)
                </small>
                {thumbnailFile && (
                  <div className="file-info">
                    Selected file: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024 / 1024 * 100) / 100} MB)
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail URL Section - Only shown when URL method is selected */}
            {uploadMethod === 'url' && (
              <div className="form-group">
                <label htmlFor="thumbnail">Thumbnail URL *</label>
                <input
                  type="url"
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  required={uploadMethod === 'url'}
                  placeholder="Auto-generated or custom thumbnail URL"
                />
                <small className="form-help">
                  Thumbnail will be auto-generated for YouTube/Vimeo. You can override with a custom URL.
                </small>
              </div>
            )}

            {formData.thumbnail && (
              <div className="thumbnail-preview">
                <img 
                  src={formData.thumbnail} 
                  alt="Thumbnail preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {thumbnailFile && (
              <div className="thumbnail-preview">
                <img 
                  src={URL.createObjectURL(thumbnailFile)} 
                  alt="Thumbnail preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="upload-button"
              disabled={loading || (!formData.url && !videoFile)}
            >
              {loading ? 'Uploading...' : 'Upload Video'}
            </button>
          </form>

          {uploadTips}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Upload);