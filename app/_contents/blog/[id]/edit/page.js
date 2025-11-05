"use client"; // Mark this component as a Client Component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use `next/navigation` in the App Router
import axios from 'axios';

export default function EditPost({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [post, setPost] = useState({
    title: '',
    content: '',
  });
  
  const [loading, setLoading] = useState(false);

  // Fetch post data by ID when the component loads
  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${id}`); // Assuming API to get a post by ID
        const data = await res.json();
        setPost({
          title: data.title,
          content: data.content,
        });
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    }

    if (id) {
      fetchPost();
    }
  }, [id]);

  // Handle input change
  function handleChange(e) {
    const { id, value } = e.target;
    setPost((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      // Use Axios to send the PATCH request
      const res = await axios.patch(`/api/posts/${id}`, post, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 200) {
        // Navigate back to the blog post after successful editing
        alert("Update successfully");
        router.push(`/contents/blog/${id}`);
      } else {
        
        console.error('Failed to update the post:', res.data.message);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert("Failed to update post. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Post: {id}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={post.title}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            value={post.content}
            onChange={handleChange}
            rows={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/contents/blog/${id}`)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
