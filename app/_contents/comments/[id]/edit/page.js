"use client"; // Mark this component as a Client Component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use `next/navigation` in the App Router
import axios from 'axios';

export default function EditComment({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [comment, setComment] = useState({
    content: '',
    postId: '', 
  });
  
  const [loading, setLoading] = useState(false);

  // Fetch post data by ID when the component loads
  useEffect(() => {
    async function fetchComment() {
      try {
        const res = await fetch(`/api/comments/${id}`); // Assuming API to get a post by ID
        const data = await res.json();
        setComment({
            content: data.content,
            postId: data.postId,  // Set postId from fetched data
          });
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    }

    if (id) {
        fetchComment();
    }
  }, [id]);

  // Handle input change
  function handleChange(e) {
    const { id, value } = e.target;
    setComment((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      // Use Axios to send the PATCH request
      const res = await axios.patch(`/api/comments/${id}`, comment, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 200) {
        // Navigate back to the blog post after successful editing
        alert("Update successfully");
        router.push(`/contents/blog/${comment.postId}`); 
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
      <h1 className="text-2xl font-bold mb-4">Edit Comment: {id}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            value={comment.content}
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
